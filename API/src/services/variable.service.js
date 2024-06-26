const { initializeApp, getApps } = require("firebase/app");
const { getFirestore, doc, setDoc, collection, getDocs, getDoc, deleteDoc, updateDoc,  } = require("firebase/firestore");
const admin = require("firebase-admin");
require("dotenv").config();

let editTimeouts = {};
let variablesCacheDict = {};


const {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGE_SENDER_ID,
    FIREBASE_APP_ID,
} = process.env;

const serviceAccount = require('../../codeway-case-study-49281-firebase-adminsdk-pq479-306c108854.json');

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
        console.error("Error while starting the firebase app: ", error);
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
        
        // Updating local dictionary cache
        variablesCacheDict[docRef.id] = dataToUpload;
        
        return docRef;
    } catch (error) {
        console.error("Error while uploading a variable", error);
        throw error;
    }
};

const getAllVariablesData = async () => {
    try {
        if (Object.keys(variablesCacheDict).length === 0) {
            const collectionRef = collection(firestoreDb, "variables");
            const querySnapshot = await getDocs(collectionRef);

            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const { isBeingEdited, ...rest } = data;
                variablesCacheDict[doc.id] = rest;
            });
        }

        return Object.values(variablesCacheDict);
    } catch (error) {
        console.error("Error while getting the data", error);
        throw error;
    }
};

const deleteVariablesData = async (documentId) => {
    try {
        const docRef = doc(firestoreDb, "variables", documentId);
        
        // Deleting from Firestore
        await deleteDoc(docRef);
        
        // Updating local dictionary cache
        delete variablesCacheDict[documentId];
        
        return { success: true, message: "Document deleted successfully" };
    } catch (error) {
        console.error("Error while deleting the data", error);
        throw error;
    }
};


const editVariablesData = async (oldDocumentId, newData) => {
    try {
        const oldDocRef = doc(firestoreDb, "variables", oldDocumentId);
        
        // Checking if the old document exists
        const oldDocSnap = await getDoc(oldDocRef);
        if (!oldDocSnap.exists()) {
            return { success: false, message: "No matching document found to edit" };
        }

        // Checking if a document with the new parameter already exists (but only if parameter is changed)
        const newDocRef = doc(firestoreDb, "variables", newData.parameter);
        if (oldDocumentId != newData.parameter) {
            const newDocSnap = await getDoc(newDocRef);
            if (newDocSnap.exists()) {
                return { success: false, message: "A document with the new parameter already exists" };
            }
        }

        // Checking if the user timed-out (It should be true)
        if((await getIsBeingEdited(oldDocumentId)).isBeingEdited) {
            // Delete the old document
            await deleteDoc(oldDocRef);
            delete variablesCacheDict[oldDocumentId];

            // Creating a new document with the new data
            await setDoc(newDocRef, newData);
            variablesCacheDict[newData.parameter] = newData;

            return { success: true, message: "Document edited successfully" };
        } else {
            return { success: true, message: "Session Timed Out" };
        }
        
    } catch (error) {
        console.error("Error while editing the data", error);
        return { success: false, message: "Error editing data" };
    }
};

const setIsBeingEdited = async (documentId, isBeingEdited) => {
    try {
        const docRef = doc(firestoreDb, 'variables', documentId);

        // Checking if the document exists
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { success: false, message: "No matching document found" };
        }

        // Updating the isBeingEdited field with the given value
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

        const docSnap = await getDoc(docRef);

        // If document doesn't exist, return not found
        if (!docSnap.exists()) {
            return { success: false, message: 'No matching document found' };
        }

        // Extracting isBeingEdited field
        const isBeingEdited = docSnap.data().isBeingEdited;

        return { success: true, isBeingEdited: isBeingEdited };
    } catch (error) {
        console.error('Error fetching isBeingEdited field:', error);
        return { success: false, message: 'Internal Server Error' };
    }
};

const checkVariable = async (documentId) => {

    try {
        const docRef = doc(firestoreDb, 'variables', documentId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: true, message: 'Variable has been changed' }
        }
        const data = docSnap.data();
        return { success: true, data: data };

    } catch (error) {
        console.error('Error checking variable:', error);
        return { success: false, message: 'Internal Server Error' };
    }
};


const getFirebaseApp = () => app;

module.exports = {
    initializeFirebaseApp,
    isAuthenticated,
    getFirebaseApp,
    uploadVariablesData,
    getAllVariablesData,
    deleteVariablesData,
    editVariablesData,
    setIsBeingEdited,
    getIsBeingEdited,
    checkVariable
};
