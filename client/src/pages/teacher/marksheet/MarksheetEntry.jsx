import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaUpload, FaFileExcel } from 'react-icons/fa';
import { toast } from 'react-toastify';

const MarksheetEntry = () => {
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [teacher, setTeacher] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const [maxMarks, setMaxMarks] = useState({});
  const examTypes = ['Unit-I', 'Semester-I', 'Unit-II', 'Semester-II'];
  const [marksheet, setMarksheet] = useState({});

  const getDefaultMaxMarksForExam = (examType) => {
    if (examType === 'Unit-I' || examType === 'Unit-II') {
      return 20;
    }
    return 100;
  };

  useEffect(() => {
    fetchTeacherProfile();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDivision) {
      updateAvailableSubjects();
      fetchClassStudents();
    }
  }, [selectedClass, selectedDivision]);

  useEffect(() => {
    if (selectedExam && availableSubjects.length > 0) {
      const defaultMarks = getDefaultMaxMarksForExam(selectedExam);
      const initialMaxMarks = availableSubjects.reduce((acc, subject) => {
        acc[subject] = defaultMarks.toString();
        return acc;
      }, {});
      setMaxMarks(initialMaxMarks);
      setMarksheet((prevMarksheet) => {
        const updatedMarksheet = { ...prevMarksheet };
        Object.keys(updatedMarksheet).forEach((studentId) => {
          Object.keys(updatedMarksheet[studentId].subjects).forEach((subject) => {
            updatedMarksheet[studentId].subjects[subject].totalMarks = defaultMarks.toString();
          });
        });
        return updatedMarksheet;
      });
    }
  }, [selectedExam, availableSubjects]);

  const fetchTeacherProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/teacher/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher profile: ${response.status}`);
      }

      const data = await response.json();
      setTeacher(data.teacher);

      const classesSet = new Set();

      data.teacher.subjects.forEach((subject) => {
        classesSet.add(
          JSON.stringify({ class: subject.class, division: subject.division })
        );
      });

      if (data.teacher.classTeacher && data.teacher.classTeacher.class) {
        classesSet.add(
          JSON.stringify({
            class: data.teacher.classTeacher.class,
            division: data.teacher.classTeacher.division,
          })
        );
      }

      const uniqueClasses = Array.from(classesSet).map((item) =>
        JSON.parse(item)
      );
      setClasses(uniqueClasses);

      if (data.teacher.classTeacher && data.teacher.classTeacher.class) {
        setSelectedClass(data.teacher.classTeacher.class.toString());
        setSelectedDivision(data.teacher.classTeacher.division);
      } else if (uniqueClasses.length > 0) {
        setSelectedClass(uniqueClasses[0].class.toString());
        setSelectedDivision(uniqueClasses[0].division);
      }
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      toast.error('Failed to load teacher profile');
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableSubjects = () => {
    if (!teacher || !selectedClass || !selectedDivision) return;

    const classSubjects = [];

    teacher.subjects.forEach((subject) => {
      if (
        subject.class.toString() === selectedClass &&
        subject.division === selectedDivision
      ) {
        classSubjects.push(subject.subject);
      }
    });

    const isClassTeacher =
      teacher.classTeacher &&
      teacher.classTeacher.class.toString() === selectedClass &&
      teacher.classTeacher.division === selectedDivision;

    setAvailableSubjects(classSubjects);

    const defaultMarks = selectedExam ? getDefaultMaxMarksForExam(selectedExam) : 100;

    const initialMaxMarks = classSubjects.reduce((acc, subject) => {
      acc[subject] = defaultMarks.toString();
      return acc;
    }, {});
    setMaxMarks(initialMaxMarks);
  };

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/teacher/class-students?class=${selectedClass}&division=${selectedDivision}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch students');

      const data = await response.json();
      setStudents(data);

      const initialMaxMarks = availableSubjects.reduce((acc, subject) => {
        acc[subject] = '100';
        return acc;
      }, {});
      setMaxMarks(initialMaxMarks);

      const initialMarksheet = {};
      data.forEach((student) => {
        initialMarksheet[student._id] = {
          subjects: availableSubjects.reduce(
            (acc, subject) => ({
              ...acc,
              [subject]: {
                marks: '',
                totalMarks: '100',
                remarks: '',
              },
            }),
            {}
          ),
        };
      });

      setMarksheet(initialMarksheet);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      setLoading(false);
    }
  };

  const calculatePercentage = (marks, totalMarks) => {
    if (!marks || !totalMarks || totalMarks === 0) return 0;
    const marksNum = parseFloat(marks);
    const totalMarksNum = parseFloat(totalMarks);
    if (isNaN(marksNum) || isNaN(totalMarksNum)) return 0;
    return ((marksNum / totalMarksNum) * 100).toFixed(1);
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 35) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedDivision('');
    setAvailableSubjects([]);
  };

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
  };

  const handleMarksChange = (studentId, subject, field, value) => {
    setMarksheet((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        subjects: {
          ...prev[studentId].subjects,
          [subject]: {
            ...prev[studentId].subjects[subject],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleGlobalMaxMarksChange = (subject, value) => {
    setMaxMarks((prev) => ({
      ...prev,
      [subject]: value,
    }));

    setMarksheet((prev) => {
      const newMarksheet = { ...prev };

      Object.keys(newMarksheet).forEach((studentId) => {
        if (newMarksheet[studentId].subjects[subject]) {
          newMarksheet[studentId].subjects[subject].totalMarks = value;
        }
      });

      return newMarksheet;
    });
  };

  const handleSave = async () => {
    if (!selectedExam) {
      toast.error('Please select an exam type');
      return;
    }

    if (availableSubjects.length === 0) {
      toast.error('No subjects available for this class');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const updatedMarksheet = { ...marksheet };
      Object.keys(updatedMarksheet).forEach((studentId) => {
        availableSubjects.forEach((subject) => {
          if (updatedMarksheet[studentId].subjects[subject]) {
            updatedMarksheet[studentId].subjects[subject].totalMarks =
              maxMarks[subject];
          }
        });
      });

      const marksheetData = Object.entries(updatedMarksheet).map(
        ([studentId, data]) => ({
          studentId,
          examType: selectedExam,
          subjects: Object.entries(data.subjects).map(([subject, marks]) => ({
            subject,
            marks: parseInt(marks.marks) || 0,
            totalMarks: parseInt(maxMarks[subject]) || 100,
            teacherRemarks: marks.remarks || '',
          })),
        })
      );

      const response = await fetch(
        'http://localhost:5000/teacher/assign-marksheet',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ marksheets: marksheetData }),
        }
      );

      if (!response.ok) throw new Error('Failed to save marksheet');

      toast.success('Marksheet saved successfully');
    } catch (error) {
      console.error('Error saving marksheet:', error);
      toast.error('Failed to save marksheet');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingExcel(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:5000/teacher/assign-marksheet-excel',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to upload marksheet');

      toast.success('Marksheet uploaded successfully');
      await fetchClassStudents();
    } catch (error) {
      console.error('Error uploading marksheet:', error);
      toast.error('Failed to upload marksheet');
    } finally {
      setUploadingExcel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Marksheet Entry</h1>
        <Link
          to="/teacher/marksheets"
          className="text-primary-600 hover:text-primary-700"
        >
          <FaArrowLeft className="inline mr-2" />
          Back to Marksheets
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Class</option>
              {[...new Set(classes.map((c) => c.class))].map((classNum) => (
                <option key={classNum} value={classNum}>
                  {classNum}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Division
            </label>
            <select
              value={selectedDivision}
              onChange={handleDivisionChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              disabled={!selectedClass}
            >
              <option value="">Select Division</option>
              {classes
                .filter((c) => c.class.toString() === selectedClass)
                .map((c) => (
                  <option key={c.division} value={c.division}>
                    {c.division}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Type
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Exam Type</option>
              {examTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSave}
              disabled={
                saving ||
                !selectedExam ||
                !selectedClass ||
                !selectedDivision ||
                availableSubjects.length === 0
              }
              className={`px-4 py-2 rounded-md text-white flex items-center ${
                saving ||
                !selectedExam ||
                !selectedClass ||
                !selectedDivision ||
                availableSubjects.length === 0
                  ? 'bg-gray-400'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              <FaSave className="mr-2" />
              {saving ? 'Saving...' : 'Save Marksheet'}
            </button>
          </div>
        </div>

        {availableSubjects.length > 0 && students.length > 0 && (
          <div className="mb-6 border-b pb-6">
            <h3 className="text-md font-medium text-gray-800 mb-3">
              Set Maximum Marks for All Students
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {availableSubjects.map((subject) => (
                <div key={subject} className="flex items-center">
                  <label className="w-28 text-sm font-medium text-gray-700">
                    {subject}:
                  </label>
                  <input
                    type="number"
                    value={maxMarks[subject] || '100'}
                    onChange={(e) =>
                      handleGlobalMaxMarksChange(subject, e.target.value)
                    }
                    min="1"
                    className="ml-2 w-20 border rounded px-2 py-1"
                    placeholder="Max Marks"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: These maximum marks will apply to all students in this exam
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Enter Student Marks</h2>

          <div className="flex items-center space-x-4">
            <a
              href="/templates/marksheet-template.xlsx"
              download
              className="text-primary-600 hover:text-primary-700"
            >
              <FaFileExcel className="inline mr-2" />
              Download Template
            </a>

            <div className="relative">
              <input
                type="file"
                id="excelUpload"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="excelUpload"
                className={`px-4 py-2 rounded-md text-white cursor-pointer flex items-center ${
                  uploadingExcel ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <FaUpload className="mr-2" />
                {uploadingExcel ? 'Uploading...' : 'Upload Excel'}
              </label>
            </div>
          </div>
        </div>

        {availableSubjects.length === 0 && selectedClass && selectedDivision ? (
          <div className="text-center py-8 bg-yellow-50 rounded-md border border-yellow-200">
            <p className="text-yellow-700">
              You don't teach any subjects for Class {selectedClass}-{selectedDivision}.
              Please select a different class or division.
            </p>
          </div>
        ) : students.length > 0 && availableSubjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  {availableSubjects.map((subject) => (
                    <th
                      key={subject}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {subject}
                      <div className="text-xxs font-normal mt-1">
                        Max: {maxMarks[subject] || 100}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  let totalMarks = 0;
                  let totalMaxMarks = 0;
                  let totalSubjectsWithMarks = 0;

                  Object.entries(marksheet[student._id]?.subjects || {}).forEach(
                    ([subject, subjectData]) => {
                      if (availableSubjects.includes(subject) && subjectData.marks) {
                        totalMarks += parseFloat(subjectData.marks) || 0;
                        totalMaxMarks += parseFloat(maxMarks[subject]) || 100;
                        totalSubjectsWithMarks++;
                      }
                    }
                  );

                  const overallPercentage =
                    totalMaxMarks > 0
                      ? ((totalMarks / totalMaxMarks) * 100).toFixed(1)
                      : 0;

                  return (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Roll: {student.roll}
                        </div>
                      </td>
                      {availableSubjects.map((subject) => {
                        const marks =
                          marksheet[student._id]?.subjects[subject]?.marks || '';
                        const currentMaxMarks = maxMarks[subject] || '100';
                        const percentage = calculatePercentage(
                          marks,
                          currentMaxMarks
                        );
                        const percentageColor = getPercentageColor(percentage);

                        return (
                          <td
                            key={`${student._id}-${subject}`}
                            className="px-6 py-4 whitespace-nowrap"
                          >
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={marks}
                                  onChange={(e) =>
                                    handleMarksChange(
                                      student._id,
                                      subject,
                                      'marks',
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                  max={currentMaxMarks}
                                  className="w-16 border rounded px-2 py-1"
                                  placeholder="Marks"
                                />
                                <span className="text-gray-500">/</span>
                                <span className="text-gray-500 text-sm">
                                  {currentMaxMarks}
                                </span>
                                {marks && (
                                  <span
                                    className={`text-sm font-medium ${percentageColor}`}
                                  >
                                    {percentage}%
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                value={
                                  marksheet[student._id]?.subjects[subject]
                                    ?.remarks || ''
                                }
                                onChange={(e) =>
                                  handleMarksChange(
                                    student._id,
                                    subject,
                                    'remarks',
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded px-2 py-1 text-sm"
                                placeholder="Remarks"
                              />
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {totalSubjectsWithMarks > 0 && (
                          <div className="text-center">
                            <div
                              className={`text-sm font-bold ${getPercentageColor(
                                overallPercentage
                              )}`}
                            >
                              {overallPercentage}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {totalMarks}/{totalMaxMarks}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-gray-500">
              {selectedClass && selectedDivision
                ? 'No students found in this class. Please select a different class or division.'
                : 'Please select a class and division to view students.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarksheetEntry;
