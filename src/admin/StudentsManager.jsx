import React, { useEffect, useState } from "react";
import "../styles/StudentsManager.css";

export default function StudentsManager() {

  /* ================= STATE ================= */
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);

  const [photo, setPhoto] = useState(null);          // add student photo
  const [editPhoto, setEditPhoto] = useState(null);  // edit student photo

  const [semesterFilter, setSemesterFilter] = useState("");

  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({
    regno: "",
    name: "",
    department: "",
    year: ""
  });

  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editMarks, setEditMarks] = useState({ ia: "", ea: "" });

  const [studentForm, setStudentForm] = useState({
    regno: "",
    name: "",
    department: ""
  });

  const [subjectForm, setSubjectForm] = useState({
    semester: "",
    subject_code: "",
    subject_title: "",
    ia: "",
    ea: ""
  });

  /* 🔍 SEARCH STATE (ADDED ONLY) */
  const [search, setSearch] = useState("");

  const API_STUDENTS = "http://localhost:5000/api/students";
  const API_RESULTS = "http://localhost:5000/api/results";

  /* ================= LOAD STUDENTS ================= */
  const loadStudents = () => {
    fetch(API_STUDENTS)
      .then(res => res.json())
      .then(data => setStudents(data || []));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  /* ================= LOAD SUBJECTS ================= */
  const loadSubjects = regno => {
    fetch(`${API_RESULTS}/${regno}`)
      .then(res => res.json())
      .then(data => setSubjects(data || []));
  };

  /* ================= ADD STUDENT ================= */
  const addStudent = () => {
    if (!studentForm.regno || !studentForm.name) {
      alert("Reg No and Name required");
      return;
    }

    const fd = new FormData();
    fd.append("regno", studentForm.regno);
    fd.append("name", studentForm.name);
    fd.append("department", studentForm.department);
    if (photo) fd.append("photo", photo);

    fetch(API_STUDENTS, { method: "POST", body: fd }).then(() => {
      setStudentForm({ regno: "", name: "", department: "" });
      setPhoto(null);
      loadStudents();
    });
  };

  /* ================= EDIT STUDENT ================= */
  const startEditStudent = s => {
    setEditingStudentId(s.id);
    setEditStudentForm({
      regno: s.regno,
      name: s.name,
      department: s.department,
      year: s.year
    });
    setEditPhoto(null);
  };

  const updateStudent = id => {
    const fd = new FormData();
    fd.append("regno", editStudentForm.regno);
    fd.append("name", editStudentForm.name);
    fd.append("department", editStudentForm.department);
    fd.append("year", editStudentForm.year);
    if (editPhoto) fd.append("photo", editPhoto);

    fetch(`${API_STUDENTS}/${id}`, {
      method: "PUT",
      body: fd
    }).then(() => {
      setEditingStudentId(null);
      setEditPhoto(null);
      loadStudents();
    });
  };

  /* ================= DELETE STUDENT ================= */
  const deleteStudent = id => {
    if (!window.confirm("Delete this student and all subjects?")) return;

    fetch(`${API_STUDENTS}/${id}`, { method: "DELETE" })
      .then(() => {
        if (selectedStudent && selectedStudent.id === id) {
          setSelectedStudent(null);
        }
        loadStudents();
      });
  };

  /* ================= SELECT STUDENT ================= */
  const selectStudent = s => {
    setSelectedStudent(s);
    setSemesterFilter("");
    loadSubjects(s.regno);
  };

  /* ================= ADD SUBJECT ================= */
  const addSubject = () => {
    if (!selectedStudent) return;

    const { semester, subject_code, subject_title } = subjectForm;
    if (!semester || !subject_code || !subject_title) {
      alert("Fill all subject fields");
      return;
    }

    fetch(API_RESULTS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...subjectForm,
        regno: selectedStudent.regno,
        name: selectedStudent.name,
        department: selectedStudent.department,
        year: selectedStudent.year,
        semester: Number(subjectForm.semester),
        ia: Number(subjectForm.ia || 0),
        ea: Number(subjectForm.ea || 0)
      })
    }).then(() => {
      loadSubjects(selectedStudent.regno);
      setSubjectForm({
        semester: "",
        subject_code: "",
        subject_title: "",
        ia: "",
        ea: ""
      });
    });
  };

  /* ================= DELETE SUBJECT ================= */
  const deleteSubject = id => {
    if (!window.confirm("Delete this subject?")) return;
    fetch(`${API_RESULTS}/${id}`, { method: "DELETE" })
      .then(() => loadSubjects(selectedStudent.regno));
  };

  /* ================= EDIT MARKS ================= */
  const startEditMarks = sub => {
    setEditingSubjectId(sub.id);
    setEditMarks({ ia: sub.ia, ea: sub.ea });
  };

  const updateMarks = id => {
    fetch(`${API_RESULTS}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ia: Number(editMarks.ia),
        ea: Number(editMarks.ea)
      })
    }).then(() => {
      setEditingSubjectId(null);
      loadSubjects(selectedStudent.regno);
    });
  };

  const total = Number(subjectForm.ia || 0) + Number(subjectForm.ea || 0);
  const editTotal = Number(editMarks.ia || 0) + Number(editMarks.ea || 0);

  const filteredSubjects = semesterFilter
    ? subjects.filter(s => String(s.semester) === semesterFilter)
    : subjects;

  /* 🔍 FILTER STUDENTS (ADDED ONLY) */
  const filteredStudents = students.filter(s =>
    s.regno.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.department || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */
  return (
    <div className="card">
      <h3>Student & Subject Management</h3>

      {/* ===== ADD STUDENT ===== */}
      <h4>Add Student</h4>
      <input placeholder="Reg No" value={studentForm.regno}
        onChange={e => setStudentForm({ ...studentForm, regno: e.target.value })} />
      <input placeholder="Name" value={studentForm.name}
        onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} />
      <input placeholder="Department" value={studentForm.department}
        onChange={e => setStudentForm({ ...studentForm, department: e.target.value })} />
      <input type="file" accept="image/*"
        onChange={e => setPhoto(e.target.files[0])} />
      <button onClick={addStudent}>Add Student</button>

      <hr />

      {/* 🔍 SEARCH STUDENT (ADDED ONLY) */}
      <input
        type="text"
        placeholder="Search by Reg No / Name / Department"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
      />

      {/* ===== STUDENT LIST ===== */}
      <h4>Students</h4>
      <table>
        <thead>
          <tr>
            <th>Reg No</th>
            <th>Name</th>
            <th>Department</th>
            <th>Year</th>
            <th>Photo</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {filteredStudents.map(s => (
            <tr key={s.id}>
              {editingStudentId === s.id ? (
                <>
                  <td><input value={editStudentForm.regno}
                    onChange={e => setEditStudentForm({ ...editStudentForm, regno: e.target.value })} /></td>
                  <td><input value={editStudentForm.name}
                    onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })} /></td>
                  <td><input value={editStudentForm.department}
                    onChange={e => setEditStudentForm({ ...editStudentForm, department: e.target.value })} /></td>
                  <td>
                    <select
                      value={editStudentForm.year}
                      onChange={e =>
                        setEditStudentForm({ ...editStudentForm, year: e.target.value })
                      }
                    >
                      <option value="">Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                    </select>
                  </td>

                  <td><input type="file" accept="image/*"
                    onChange={e => setEditPhoto(e.target.files[0])} /></td>
                  <td>
                    <button onClick={() => updateStudent(s.id)}>Update</button>
                    <button onClick={() => setEditingStudentId(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{s.regno}</td>
                  <td>{s.name}</td>
                  <td>{s.department}</td>
                  <td>{s.year}</td>

                  <td>
                    {s.photo && (
                      <img
                        src={`http://localhost:5000/uploads/${s.photo}`}
                        alt="profile"
                        style={{ width: 40, height: 40, borderRadius: "50%" }}
                      />
                    )}
                  </td>
                  <td>
                    <button onClick={() => selectStudent(s)}>Manage</button>
                    <button onClick={() => startEditStudent(s)}>Edit</button>
                    <button
                      style={{ background: "#ff4d4d", color: "#fff" }}
                      onClick={() => deleteStudent(s.id)}
                    >
                      Remove
                    </button>
                  </td>

                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== SUBJECT / MARKS ===== */}
      {selectedStudent && (
        <>
          <h4>Subjects – {selectedStudent.name}</h4>

          <h5>Add Subject / Marks</h5>
          <select value={subjectForm.semester}
            onChange={e => setSubjectForm({ ...subjectForm, semester: e.target.value })}>
            <option value="">Semester</option>
            {[1, 2, 3, 4, 5, 6].map(s => <option key={s}>{s}</option>)}
          </select>

          <input placeholder="Subject Code"
            value={subjectForm.subject_code}
            onChange={e => setSubjectForm({ ...subjectForm, subject_code: e.target.value })} />
          <input placeholder="Subject Title"
            value={subjectForm.subject_title}
            onChange={e => setSubjectForm({ ...subjectForm, subject_title: e.target.value })} />
          <input type="number" placeholder="IA"
            value={subjectForm.ia}
            onChange={e => setSubjectForm({ ...subjectForm, ia: e.target.value })} />
          <input type="number" placeholder="EA"
            value={subjectForm.ea}
            onChange={e => setSubjectForm({ ...subjectForm, ea: e.target.value })} />
          <input readOnly value={total} placeholder="Total" />
          <button onClick={addSubject}>Add Subject</button>

          <hr />

          <table>
            <tbody>
              {filteredSubjects.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.semester}</td>
                  <td>{sub.subject_code}</td>
                  <td>{sub.subject_title}</td>

                  {editingSubjectId === sub.id ? (
                    <>
                      <td><input type="number" value={editMarks.ia}
                        onChange={e => setEditMarks({ ...editMarks, ia: e.target.value })} /></td>
                      <td><input type="number" value={editMarks.ea}
                        onChange={e => setEditMarks({ ...editMarks, ea: e.target.value })} /></td>
                      <td>{editTotal}</td>
                      <td>
                        <button onClick={() => updateMarks(sub.id)}>Update</button>
                        <button onClick={() => setEditingSubjectId(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{sub.ia}</td>
                      <td>{sub.ea}</td>
                      <td>{sub.total}</td>
                      <td>
                        <button onClick={() => startEditMarks(sub)}>Edit</button>
                        <button onClick={() => deleteSubject(sub.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
