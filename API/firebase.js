const { initializeApp, getApps } = require("firebase/app");
const { errorHandler } = require("./helpers");
const { getFirestore, doc, setDoc, collection, getDocs, getDoc, deleteDoc, updateDoc } = require("firebase/firestore");
const admin = require("firebase-admin");
require("dotenv").config();

let editTimeouts = {};

const {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGE_SENDER_ID,
    FIREBASE_APP_ID,
} = process.env;

const serviceAccount = require('./codeway-case-study-49281-firebase-adminsdk-pq479-827abfe7e6.json');

const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGE_SENDER_ID,
    appId: FIREBASE_APP_ID,
};

let app;
let firestoreDb;

const initializeFirebaseApp = () => {
    try {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
            firestoreDb = getFirestore(app);

            // Initialize Admin SDK
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            app = getApps()[0];
            firestoreDb = getFirestore(app);
        }
    } catch (error) {
        errorHandler(error, "firebase-initializeFirebaseApp");
    }
};

const isAuthenticated = (req, res, next) => {
    const idToken = req.headers.authorization;
    if (!idToken) {
        return res.status(401).send('Unauthorized');
    }

    admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            req.user = decodedToken;
            next();
        })
        .catch((error) => {
            console.error('Error verifying Firebase ID token:', error);
            res.status(401).send('Unauthorized');
        });
};

const uploadVariablesData = async (dataToUpload) => {
    try {
        dataToUpload.isBeingEdited = false;

        const docRef = doc(firestoreDb, "variables", dataToUpload.parameter);
        await setDoc(docRef, dataToUpload);
        return docRef;
    } catch (error) {
        errorHandler(error, "firebase-uploadProcessedData");
    }
};

const getVariablesData = async () => {
    try {
        const collectionRef = collection(firestoreDb, "variables");
        const querySnapshot = await getDocs(collectionRef);


        // Extracting data from each document
        const finalData = querySnapshot.docs.map(doc => doc.data());

        return finalData;
    } catch (error) {
        errorHandler(error, "firebase-getData");
    }
};

const getParameterAndValue = async () => {
    try {
        const collectionRef = collection(firestoreDb, "variables");
        const querySnapshot = await getDocs(collectionRef);

        // Create an object to hold parameter-value pairs
        const parameterValueData = {};
        querySnapshot.forEach(doc => {
            const data = doc.data();
            parameterValueData[data.parameter] = data.value;
        });

        return parameterValueData;
    } catch (error) {
        errorHandler(error, "firebase-getParameterAndValue");
    }
};

const deleteVariablesData = async (documentId) => {
    try {
        const docRef = doc(firestoreDb, "variables", documentId);
        
        // Check if the document exists
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { success: false, message: "No matching document found" };
        }

        // Delete the document
        await deleteDoc(docRef);

        return { success: true, message: "Document deleted successfully" };
    } catch (error) {
        errorHandler(error, "firebase-deleteData");
        return { success: false, message: "Error deleting data" };
    }
};

const editVariablesData = async (oldDocumentId, newData) => {
    try {
        const oldDocRef = doc(firestoreDb, "variables", oldDocumentId);
        
        // Check if the old document exists
        const oldDocSnap = await getDoc(oldDocRef);
        if (!oldDocSnap.exists()) {
            return { success: false, message: "No matching document found to edit" };
        }

        // Check if a document with the new parameter already exists (but only if parameter is changed)
        const newDocRef = doc(firestoreDb, "variables", newData.parameter);
        if (oldDocumentId != newData.parameter) {
            const newDocSnap = await getDoc(newDocRef);
            if (newDocSnap.exists()) {
                return { success: false, message: "A document with the new parameter already exists" };
            }
        }

        // Lets check if the user timed-out (It should be true)
        if((await getIsBeingEdited(oldDocumentId)).isBeingEdited) {
            // Delete the old document
            await deleteDoc(oldDocRef);

            // Create a new document with the new data
            await setDoc(newDocRef, newData);


            return { success: true, message: "Document edited successfully" };
        } else {
            return { success: true, message: "Session Timed Out" };
        }
        
    } catch (error) {
        errorHandler(error, "firebase-editData");
        return { success: false, message: "Error editing data" };
    }
};

const setIsBeingEdited = async (documentId, isBeingEdited) => {
    try {
        const docRef = doc(firestoreDb, 'variables', documentId);

        // Check if the document exists
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { success: false, message: "No matching document found" };
        }

        // Update the isBeingEdited field with the given value
        await updateDoc(docRef, { isBeingEdited: isBeingEdited });

        if (isBeingEdited) {
            if (editTimeouts[documentId]) {
              clearTimeout(editTimeouts[documentId]);
            }
            editTimeouts[documentId] = setTimeout(async () => {
              await updateDoc(docRef, { isBeingEdited: false });
              delete editTimeouts[documentId];
            }, 5 * 60 * 1000); // Reset after 5 minutes
          } else if (editTimeouts[documentId]) {
            clearTimeout(editTimeouts[documentId]);
            delete editTimeouts[documentId];
          }

        return { success: true, message: `Document ${documentId} updated with isBeingEdited: ${isBeingEdited}` };
    } catch (error) {
        console.error('Error updating isBeingEdited field:', error);
        return { success: false, message: 'Internal Server Error' };
    }
};

const getIsBeingEdited = async (documentId) => {
    try {
        const docRef = doc(firestoreDb, 'variables', documentId);

        // Get the document
        const docSnap = await getDoc(docRef);

        // If document doesn't exist, return not found
        if (!docSnap.exists()) {
            return { success: false, message: 'No matching document found' };
        }

        // Extract isBeingEdited field
        const isBeingEdited = docSnap.data().isBeingEdited;

        return { success: true, isBeingEdited: isBeingEdited };
    } catch (error) {
        console.error('Error fetching isBeingEdited field:', error);
        return { success: false, message: 'Internal Server Error' };
    }
};


const getFirebaseApp = () => app;

module.exports = {
    initializeFirebaseApp,
    isAuthenticated,
    getFirebaseApp,
    uploadVariablesData,
    getVariablesData,
    deleteVariablesData,
    editVariablesData,
    setIsBeingEdited,
    getIsBeingEdited,
    getParameterAndValue
};
