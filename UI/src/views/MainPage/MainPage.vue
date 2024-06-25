<template>
  <div>
    <div class="header">
      <img src="img/logo.png" alt="Logo" class="site-logo">
      <img src="img/user.png" alt="User Icon" @click="toggleDropdown" class="user-icon">
      <div class="dropdown" v-if="showDropdown">
        <button @click="handleSignOut">Sign Out</button>
      </div>
    </div>
    <div class="content">
      <div class="parameter-container">
        <button @click="refreshPage" class="refresh-button">Get Recent Changes</button>
        <template v-if="isMobile">
          <div v-for="parameter in parameters" :key="parameter.parameter" class="parameter-card">
            <div class="parameter-details">
              <div>
                <strong>Parameter Key:</strong>
                <span v-if="!parameter.isEditing">{{ parameter.parameter }}</span>
                <input v-else type="text" v-model="parameter.editKey" class="edit-input">
              </div>
              <div>
                <strong>Value:</strong>
                <span v-if="!parameter.isEditing">{{ parameter.value }}</span>
                <input v-else type="text" v-model="parameter.editValue" class="edit-input">
              </div>
              <div>
                <strong>Description:</strong>
                <span v-if="!parameter.isEditing">{{ parameter.desc }}</span>
                <input v-else type="text" v-model="parameter.editDescription" class="edit-input">
              </div>
              <div>
                <strong>Create Date:</strong> {{ parameter.createDate }}
              </div>
            </div>
            <div class="parameter-card-actions">
              <button v-if="!parameter.isEditing" @click="editParameter(parameter)" class="edit-button">Edit</button>
              <button v-else @click="submitEdit(parameter)" class="submit-button">Submit</button>
              <button @click="deleteParameter(parameter)" class="delete-button">Del</button>
            </div>
          </div>
          <div class="new-parameter">
            <input type="text" v-model="newParameter.parameter" placeholder="New Parameter" class="new-input">
            <input type="text" v-model="newParameter.value" placeholder="New Value" class="new-input">
            <input type="text" v-model="newParameter.desc" placeholder="New Description" class="new-input">
            <button @click="addParameter" class="add-button">Add</button>
          </div>
        </template>
        <template v-else>
          <table class="parameter-table">
            <thead>
              <tr>
                <th class="parameter-key">Parameter Key</th>
                <th class="parameter-value">Value</th>
                <th class="parameter-description">Description</th>
                <th class="parameter-date centered" @click="sortParametersByDate">
                  Create Date
                  <span :class="sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'"></span>
                </th>
                <th class="parameter-actions centered">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="parameter in parameters" :key="parameter.parameter">
                <td v-if="!parameter.isEditing">{{ parameter.parameter }}</td>
                <td v-else><input type="text" v-model="parameter.editKey" class="new-input"></td>
                <td v-if="!parameter.isEditing">{{ parameter.value }}</td>
                <td v-else><input type="text" v-model="parameter.editValue" class="new-input"></td>
                <td v-if="!parameter.isEditing">
                  <div>{{ parameter.desc }}</div>
                </td>
                <td v-else><input type="text" v-model="parameter.editDescription" class="new-input"></td>
                <td class="parameter-date centered">{{ formatDate(parameter.createDate) }}</td>
                <td>
                  <div class="action-buttons">
                    <button v-if="!parameter.isEditing" @click="editParameter(parameter)" class="edit-button">Edit</button>
                    <button v-else @click="submitEdit(parameter)" class="submit-button">Submit</button>
                    <button @click="deleteParameter(parameter)" class="delete-button">Delete</button>
                  </div>
                </td>
              </tr>
              <tr class="new-parameter-row">
                <td><input type="text" v-model="newParameter.parameter" placeholder="New Parameter" class="new-input"></td>
                <td><input type="text" v-model="newParameter.value" placeholder="New Value" class="new-input"></td>
                <td><input type="text" v-model="newParameter.desc" placeholder="New Description" class="new-input"></td>
                <td></td>
                <td>
                  <div class="action-buttons">
                    <button @click="addParameter" class="add-button">Add</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </div>
  </div>
  <footer>Built by Emir Asal © 2024</footer>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from 'vue-router';
import axios from 'axios';

const showDropdown = ref(false);
const isMobile = ref(window.innerWidth <= 768);
const auth = getAuth();
const router = useRouter();

const parameters = ref([]);
const newParameter = ref({ parameter: '', value: '', desc: '' });
const sortOrder = ref('asc');
let currentEditingParameter = ref(null);

const fetchParameters = async () => {
  try {
    const idToken = await auth.currentUser.getIdToken(true);
    const response = await axios.get('http://localhost:3000/variables/getAll', {
      headers: {
        'Authorization': idToken
      }
    });
    parameters.value = response.data.map(param => ({
      ...param,
      isEditing: false,
      oldParameter: param.parameter,
      editKey: '',
      editValue: '',
      editDescription: ''
    }));
  } catch (error) {
    console.error('Error fetching parameters:', error);
  }
};

const addParameter = async () => {
  if (newParameter.value.parameter && newParameter.value.value && newParameter.value.desc) {
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const parameterToAdd = {
        ...newParameter.value,
        createDate: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      };
      await axios.post('http://localhost:3000/variables/add', parameterToAdd, {
        headers: {
          'Authorization': idToken
        }
      });
      parameters.value.push({ ...parameterToAdd, isEditing: false, oldParameter: parameterToAdd.parameter, editKey: '', editValue: '', editDescription: '' });
      newParameter.value = { parameter: '', value: '', desc: '' };
    } catch (error) {
      console.error('Error adding parameter:', error);
    }
  }
};

const deleteParameter = async (parameter) => {
  try {
    const idToken = await auth.currentUser.getIdToken(true);
    await axios.delete(`http://localhost:3000/variables/delete/${parameter.parameter}`, {
      headers: {
        'Authorization': idToken
      }
    });
    parameters.value = parameters.value.filter(p => p.parameter !== parameter.parameter);
  } catch (error) {
    console.error('Error deleting parameter:', error);
  }
};
/*
const editParameter = async (parameter) => {
  try {
    const idToken = await auth.currentUser.getIdToken(true);
    const response = await axios.get(`http://localhost:3000/variables/getEditField/${parameter.parameter}`, {
      headers: {
        'Authorization': idToken
      }
    });
    if (response.data.isBeingEdited) {
      alert('This parameter is already being edited by another user.');
    } else {
      // Add the following code block
      try {
        const editFieldResponse = await axios.get(`http://localhost:3000/variables/checkVariable/${parameter.parameter}`, {
          headers: {
            'Authorization': idToken
          }
        });

        console.log(parameter);
        // Check if the variable exists
        if (editFieldResponse.data !== 'Variable does not exist.') {
          // If the variable exists, update edit fields
          parameter.editKey = editFieldResponse.data.parameter;
          parameter.editValue = editFieldResponse.data.value;
          parameter.editDescription = editFieldResponse.data.desc;
        } else {
          
          alert('Variable does not exist.');
        }
      } catch (error) {
        console.error('Error fetching edit fields:', error);
        // Handle error fetching edit fields
        alert('Failed to fetch edit fields from the server.');
      }


      await axios.post('http://localhost:3000/variables/setEditField', {
        documentId: parameter.oldParameter,
        isBeingEdited: true
      }, {
        headers: {
          'Authorization': idToken
        }
      });
       
      parameter.isEditing = true; 
    }
  } catch (error) {
    console.error('Error checking or setting edit field:', error);
  }
}; */

const editParameter = async (parameter) => {
  try {
    const idToken = await auth.currentUser.getIdToken(true);

    const checkResponse = await axios.get(`http://localhost:3000/variables/checkVariable/${parameter.parameter}`, {
      headers: {
        'Authorization': idToken
      }
    });

    if (checkResponse.data !== 'Variable has been changed') {
      // If the variable exists, fetch the edit fields
      const editFieldResponse = await axios.get(`http://localhost:3000/variables/getEditField/${parameter.parameter}`, {
        headers: {
          'Authorization': idToken
        }
      });

      if (editFieldResponse.data.isBeingEdited) {
        alert('This parameter is already being edited by another user.');
      } else {
        // Update edit fields in the parameter
        parameter.editKey = checkResponse.data.parameter;
        parameter.editValue = checkResponse.data.value;
        parameter.editDescription = checkResponse.data.desc;

        // Set isBeingEdited to true after fetching edit fields
        await axios.post('http://localhost:3000/variables/setEditField', {
          documentId: parameter.parameter,
          isBeingEdited: true
        }, {
          headers: {
            'Authorization': idToken
          }
        });


        parameter.isEditing = true;
        //currentEditingParameter.value = parameter.oldParameter;
      }
    } else {
      // Variable does not exist
      alert('Variable has been changed.');
      window.location.reload(); 
    }
  } catch (error) {
    console.error('Error checking or setting edit field:', error);
    // Handle error checking or setting edit field
    alert('Failed to perform edit operation. Please try again later.');
  }
};



const submitEdit = async (parameter) => {
  try {
    const idToken = await auth.currentUser.getIdToken(true);
    const updatedParameter = {
      parameter: parameter.editKey,
      value: parameter.editValue,
      desc: parameter.editDescription,
      createDate: parameter.createDate
    };
    const response = await axios.post(`http://localhost:3000/variables/edit/${parameter.oldParameter}`, updatedParameter, {
      headers: {
        'Authorization': idToken
      }
    });
    if (response.data.message === "Session Timed Out") {
      refreshPage();
      alert('Your session has timed out. Please try again.');
    } else {
      parameter.parameter = updatedParameter.parameter;
      parameter.value = updatedParameter.value;
      parameter.desc = updatedParameter.desc;
      parameter.isEditing = false;
      currentEditingParameter.value = null;
    }
  } catch (error) {
    console.error('Error editing parameter:', error);
    alert('Failed to edit parameter. Please try again.');
  }
};

const resetEditField = async () => {
  if (currentEditingParameter.value) {
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      await axios.post('http://localhost:3000/variables/setEditField', {
        documentId: currentEditingParameter.value,
        isBeingEdited: false
      }, {
        headers: {
          'Authorization': idToken
        }
      });
    } catch (error) {
      console.error('Error resetting edit field:', error);
    }
  }
};

const handleSignOut = () => {
  signOut(auth).then(() => {
    router.push("/signin");
  });
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const updateIsMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

const refreshPage = () => {
  location.reload();
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
};

const sortParametersByDate = () => {
  if (sortOrder.value === 'asc') {
    parameters.value.sort((a, b) => new Date(a.createDate) - new Date(b.createDate));
    sortOrder.value = 'desc';
  } else {
    parameters.value.sort((a, b) => new Date(b.createDate) - new Date(a.createDate));
    sortOrder.value = 'asc';
  }
};

onMounted(() => {
  fetchParameters();
  window.addEventListener('resize', updateIsMobile);
  window.addEventListener('beforeunload', resetEditField);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
  window.removeEventListener('beforeunload', resetEditField);
});
</script>

<style src="./MainPage.css"></style>
