const express = require('express');
const { uploadVariablesData, getVariablesData, deleteVariablesData, editVariablesData, setIsBeingEdited, getIsBeingEdited, getParameterAndValue, checkVariable } = require("../services/variable.service.js");
const { isAuthenticated } = require("../services/variable.service.js");

const router = express.Router();

router.post('/add', async (req, res) => {
    try {
        // Uploading the data to Firestore
        await uploadVariablesData(req.body);

        res.send('Data uploaded successfully!');
    } catch (error) {
        res.status(500).send('Error uploading data');
    }
});

router.get('/getAll', async (req, res) => {
    try {
        const data = await getVariablesData();
        res.json(data);
    } catch (error) {
        console.error("Error retrieving data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/getAllParameterAndValue', async (req, res) => {
    try {
        const data = await getParameterAndValue();
        res.json(data);
    } catch (error) {
        console.error("Error retrieving parameter and value:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete('/delete/:parameter', isAuthenticated, async (req, res) => {
    try {
        const parameter = req.params.parameter;
        const result = await deleteVariablesData(parameter);
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ error: result.message });
        }
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/edit/:oldParameter', async (req, res) => {
    const oldParameter = req.params.oldParameter;
    const newData = req.body;

    try {
        const result = await editVariablesData(oldParameter, newData);
        if (result.success) {
            res.status(200).json({ message: result.message });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        console.error('Error editing variables data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/setEditField', async (req, res) => {
    const { documentId, isBeingEdited } = req.body;

    try {
        const result = await setIsBeingEdited(documentId, isBeingEdited);
        res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        console.error('Error in setIsBeingEdited:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


router.get('/getEditField/:documentId', async (req, res) => {
    const documentId = req.params.documentId;

    try {
        const result = await getIsBeingEdited(documentId);
        if (result.success) {
            res.status(200).json({ isBeingEdited: result.isBeingEdited });
        } else {
            res.status(404).json({ message: result.message });
        }
    } catch (error) {
        console.error('Error in getIsBeingEdited:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// This method will run before user starts editing. And check if the variable is up-to-date
router.get('/checkVariable/:documentId', async (req, res) => {
    const documentId = req.params.documentId;
  
    try {
      const result = await checkVariable(documentId);
  
      if (result.message === 'Variable has been changed') {
        return res.status(200).json(result.message);
      }

      return res.status(200).json(result.data);
    } catch (error) {
      console.error('Error fetching document:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

module.exports = router;
