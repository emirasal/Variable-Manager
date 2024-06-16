<template>
  <div>
    <div class="header">
      <img src="logo.png" alt="Logo" class="site-logo">
      <img src="/user.png" alt="User Icon" @click="toggleDropdown" class="user-icon">
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

const editParameter = async (parameter) => {
  try {
    const idToken = await auth.currentUser.getIdToken(true);
    const response = await axios.get(`http://localhost:3000/variables/getEditField/${parameter.oldParameter}`, {
      headers: {
        'Authorization': idToken
      }
    });
    if (response.data.isBeingEdited) {
      alert('This parameter is already being edited by another user.');
    } else {
      await axios.post('http://localhost:3000/variables/setEditField', {
        documentId: parameter.oldParameter,
        isBeingEdited: true
      }, {
        headers: {
          'Authorization': idToken
        }
      });
      parameter.isEditing = true;
      parameter.editKey = parameter.parameter;
      parameter.editValue = parameter.value;
      parameter.editDescription = parameter.desc;
      currentEditingParameter.value = parameter.oldParameter;
    }
  } catch (error) {
    console.error('Error checking or setting edit field:', error);
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

<style scoped>
body {
  font-family: 'Roboto', sans-serif;
}

.header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 20px 40px;
  box-sizing: border-box;
  position: fixed;
}

.site-logo, .user-icon {
  width: 60px;
  height: 60px;
  cursor: pointer;
}

.dropdown {
  position: absolute;
  right: 20px;
  top: 80px;
  background-color: #2d2d44;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  padding: 10px;
}

.dropdown button {
  background: none;
  border: 1px solid #6a11cb;
  border-radius: 5px;
  color: #fff;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease, color 0.3s ease;
}

.dropdown button:hover {
  background: #6a11cb;
}

.content {
  width: 100%;
  padding: 120px 20px 20px;
  box-sizing: border-box;
}

.parameter-container {
  width: 100%;
  max-width: 90%;
  margin: 0 auto;
  background-color: #1e1e2f;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.parameter-table {
  width: 100%;
  border-collapse: collapse;
  color: #fff;
  table-layout: fixed;
}

.parameter-table th, .parameter-table td {
  padding: 10px;
  border: 1px solid #333;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.parameter-table th {
  background-color: #282c34;
}

.parameter-table th.parameter-key, .parameter-table td.parameter-key,
.parameter-table th.parameter-value, .parameter-table td.parameter-value,
.parameter-table th.parameter-date, .parameter-table td.parameter-date,
.parameter-table th.parameter-actions, .parameter-table td.parameter-actions {
  width: 10%;
  text-align: center;
  vertical-align: middle;
}

.parameter-table th.parameter-description, .parameter-table td.parameter-description {
  width: 40%;
  text-align: center;
  vertical-align: middle;
}

.new-parameter-row td, .new-parameter-row input, .new-input, .edit-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #333;
  background-color: #282c34;
  color: #fff;
  box-sizing: border-box;
}

.new-parameter-row input, .new-input, .edit-input {
  border-radius: 0;
}

.edit-button, .delete-button, .add-button, .submit-button, .refresh-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  margin: 0 2px;
  cursor: pointer;
  border-radius: 3px;
}

.delete-button {
  background-color: #dc3545;
}

.add-button, .submit-button {
  background-color: #28a745;
}

.refresh-button {
  background-color: #ff4c4c;
  margin-bottom: 20px;
  text-align: left;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

.arrow-up::after {
  content: '▲';
  margin-left: 5px;
}

.arrow-down::after {
  content: '▼';
  margin-left: 5px;
}

/* Mobile */
@media only screen and (max-width: 768px) {
  .parameter-card {
    background-color: #282c34;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    margin-bottom: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    color: #fff;
  }

  .parameter-details {
    margin-bottom: 10px;
    text-align: left;
  }

  .parameter-details div {
    margin-bottom: 5px;
  }

  .parameter-card-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .new-parameter {
    background-color: #282c34;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    padding: 20px;
    margin-top: 20px;
    color: #fff;
  }

  .new-parameter input {
    margin-bottom: 10px;
    border-radius: 5px;
    background-color: #1e1e2f;
  }

  .new-parameter button {
    width: 100%;
    padding: 10px;
  }
}
footer {
  color: #a0a0c1;
}
</style>
