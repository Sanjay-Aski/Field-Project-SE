import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSave, FaEye, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import FormPreview from './FormPreview';

const FormBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fields: [],
    assignedTo: 'class',
    class: {
      standard: '',
      division: ''
    },
    studentIds: []
  });
  const [classes, setClasses] = useState([]);
  const [divisions, setDivisions] = useState(['A', 'B', 'C', 'D', 'E']);
  const [students, setStudents] = useState([]);
  const [errors, setErrors] = useState({});
  const [currentField, setCurrentField] = useState({
    label: '',
    type: 'text',
    required: false,
    options: ['']
  });
  const [editingFieldIndex, setEditingFieldIndex] = useState(-1);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' }
  ];

  useEffect(() => {
    fetchClassesAndStudents();
    if (id) {
      fetchFormData();
    }
  }, [id]);

  const fetchClassesAndStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/teacher/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher profile');
      }

      const data = await response.json();
      
      if (data.success && data.teacher) {
        // Get classes from teacher's subjects and class teacher assignment
        const classesSet = new Set();
        
        if (data.teacher.classTeacher && data.teacher.classTeacher.class) {
          classesSet.add(JSON.stringify({
            class: data.teacher.classTeacher.class,
            division: data.teacher.classTeacher.division
          }));
        }
        
        data.teacher.subjects.forEach(subject => {
          classesSet.add(JSON.stringify({
            class: subject.class,
            division: subject.division
          }));
        });
        
        const uniqueClasses = Array.from(classesSet).map(item => JSON.parse(item));
        setClasses(uniqueClasses);
        
        // If this is a new form and teacher is a class teacher, set default class
        if (!id && data.teacher.classTeacher) {
          setFormData(prev => ({
            ...prev,
            class: {
              standard: data.teacher.classTeacher.class,
              division: data.teacher.classTeacher.division
            }
          }));
          
          // Also fetch students for this class
          fetchStudentsForClass(data.teacher.classTeacher.class, data.teacher.classTeacher.division);
        }
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      toast.error('Failed to load teacher data');
    }
  };

  const fetchStudentsForClass = async (classStandard, division) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/teacher/class-students?class=${classStandard}&division=${division}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/teacher/form/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch form data');
      }

      const data = await response.json();
      
      if (data.success) {
        setFormData(data.form);
        // Fetch students if assigned to specific students or to a class
        if (data.form.assignedTo === 'specific' && data.form.studentIds?.length > 0) {
          // Just use the studentIds already in the form
        } else if (data.form.assignedTo === 'class' && data.form.class) {
          fetchStudentsForClass(data.form.class.standard, data.form.class.division);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch form data');
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error(error.message || 'Failed to load form data');
      navigate('/teacher/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('class.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        class: {
          ...prev.class,
          [field]: field === 'standard' ? parseInt(value) : value
        }
      }));
      
      // If changing class details, fetch corresponding students
      if (field === 'standard' || field === 'division') {
        const newClass = field === 'standard' 
          ? parseInt(value) 
          : formData.class.standard;
        const newDivision = field === 'division' 
          ? value 
          : formData.class.division;
        
        if (newClass && newDivision) {
          fetchStudentsForClass(newClass, newDivision);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear any error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFieldInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setCurrentField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentField(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setCurrentField(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    setCurrentField(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      return { ...prev, options: newOptions.length ? newOptions : [''] };
    });
  };

  const handleAddField = () => {
    if (!currentField.label.trim()) {
      toast.error('Field label is required');
      return;
    }
    
    // Additional validation for options if needed
    if (['select', 'radio', 'checkbox'].includes(currentField.type)) {
      const validOptions = currentField.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 1) {
        toast.error('At least one valid option is required');
        return;
      }
      
      // Update options to only include valid ones
      setCurrentField(prev => ({
        ...prev,
        options: validOptions
      }));
    }
    
    // Add new field or update existing one
    setFormData(prev => {
      const updatedFields = [...prev.fields];
      
      if (editingFieldIndex >= 0) {
        updatedFields[editingFieldIndex] = { ...currentField };
      } else {
        updatedFields.push({ ...currentField });
      }
      
      return { ...prev, fields: updatedFields };
    });
    
    // Reset current field and editing state
    setCurrentField({
      label: '',
      type: 'text',
      required: false,
      options: ['']
    });
    setEditingFieldIndex(-1);
    setShowFieldEditor(false);
  };

  const handleEditField = (index) => {
    setCurrentField({ ...formData.fields[index] });
    setEditingFieldIndex(index);
    setShowFieldEditor(true);
  };

  const handleRemoveField = (index) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleStudentSelection = (e) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      const updatedStudentIds = checked
        ? [...prev.studentIds, value]
        : prev.studentIds.filter(id => id !== value);
      
      return { ...prev, studentIds: updatedStudentIds };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.fields.length === 0) {
      newErrors.fields = 'At least one field is required';
    }
    
    if (formData.assignedTo === 'class') {
      if (!formData.class.standard) {
        newErrors['class.standard'] = 'Class is required';
      }
      if (!formData.class.division) {
        newErrors['class.division'] = 'Division is required';
      }
    } else if (formData.assignedTo === 'specific') {
      if (formData.studentIds.length === 0) {
        newErrors.studentIds = 'At least one student must be selected';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Prepare data differently based on form assignment type
      const formDataToSend = { ...formData };
      
      if (formData.assignedTo === 'class') {
        // Remove studentIds if assigning to whole class
        delete formDataToSend.studentIds;
      } else {
        // Remove class info if assigning to specific students
        delete formDataToSend.class;
      }
      
      const url = id 
        ? `http://localhost:5000/teacher/form/${id}` 
        : 'http://localhost:5000/teacher/give-form';
      
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formDataToSend)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save form');
      }
      
      toast.success(`Form ${id ? 'updated' : 'created'} successfully`);
      navigate('/teacher/forms');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(error.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-primary-600 text-3xl" />
      </div>
    );
  }

  if (showPreview) {
    return (
      <FormPreview 
        form={formData} 
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {id ? 'Edit Form' : 'Create New Form'}
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaEye className="mr-2" /> Preview
          </button>
          <button
            onClick={() => navigate('/teacher/forms')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft className="mr-2" /> Back to Forms
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Form Details</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter form title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the purpose of this form"
                ></textarea>
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Form Fields</h2>
            
            {errors.fields && <p className="mb-2 text-sm text-red-500">{errors.fields}</p>}
            
            {!showFieldEditor ? (
              <button
                type="button"
                onClick={() => setShowFieldEditor(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <FaPlus className="mr-2" /> Add Field
              </button>
            ) : (
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Label <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="label"
                      value={currentField.label}
                      onChange={handleFieldInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter field label"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Type
                    </label>
                    <select
                      name="type"
                      value={currentField.type}
                      onChange={handleFieldInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="required"
                      checked={currentField.required}
                      onChange={handleFieldInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required field</span>
                  </label>
                </div>
                
                {['select', 'radio', 'checkbox'].includes(currentField.type) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    {currentField.options.map((option, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          placeholder={`Option ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                          disabled={currentField.options.length === 1}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOption}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm flex items-center mt-2"
                    >
                      <FaPlus className="mr-1" /> Add Option
                    </button>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowFieldEditor(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    {editingFieldIndex >= 0 ? 'Update Field' : 'Add Field'}
                  </button>
                </div>
              </div>
            )}
            
            {formData.fields.length > 0 ? (
              <div className="mt-4 border rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-medium text-gray-700">Form Fields</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {formData.fields.map((field, index) => (
                    <li key={index} className="px-4 py-3 flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-800">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({fieldTypes.find(t => t.value === field.type)?.label || field.type})
                        </span>
                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Options: {field.options.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditField(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4 text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-gray-500">No fields added yet. Add your first field to continue.</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Form Assignment</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="assignedTo"
                    value="class"
                    checked={formData.assignedTo === 'class'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Entire class</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="assignedTo"
                    value="specific"
                    checked={formData.assignedTo === 'specific'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Specific students</span>
                </label>
              </div>
            </div>
            
            {formData.assignedTo === 'class' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="class.standard"
                    value={formData.class.standard}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                      errors['class.standard'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Class</option>
                    {[...new Set(classes.map(c => c.class))].map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  {errors['class.standard'] && (
                    <p className="mt-1 text-sm text-red-500">{errors['class.standard']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Division <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="class.division"
                    value={formData.class.division}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                      errors['class.division'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={!formData.class.standard}
                  >
                    <option value="">Select Division</option>
                    {divisions.map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                  {errors['class.division'] && (
                    <p className="mt-1 text-sm text-red-500">{errors['class.division']}</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Students <span className="text-red-500">*</span>
                </label>
                {errors.studentIds && <p className="mb-2 text-sm text-red-500">{errors.studentIds}</p>}
                
                {students.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {students.map(student => (
                      <div key={student._id} className="mb-2 last:mb-0">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            value={student._id}
                            checked={formData.studentIds.includes(student._id)}
                            onChange={handleStudentSelection}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {student.fullName} - Roll: {student.roll}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-gray-500">No students available. Please select a class first.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/teacher/forms')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {id ? 'Update Form' : 'Create Form'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormBuilder;
