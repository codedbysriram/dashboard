import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StudentsManager.css";
import { supabase } from "../supabaseClient";
import ScrollButton from "../components/ScrollButton";


export default function StudentsManager() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);

  const [photo, setPhoto] = useState(null);
  const [editPhoto, setEditPhoto] = useState(null);

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
    department: "",
    year: ""
  });

  const [subjectForm, setSubjectForm] = useState({
    semester: "",
    subject_code: "",
    subject_title: "",
    ia: "",
    ea: ""
  });

  const [search, setSearch] = useState("");

  /* ================= HELPERS ================= */

  const getPhotoUrl = (photo) => {
    return photo && photo.trim() !== "" ? photo : "/default.png";
  };


  const uploadPhotoToSupabase = async (file, regno) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${regno}.${fileExt}`;

      const { error } = await supabase.storage
        .from("student-photos")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("student-photos")
        .getPublicUrl(fileName);

      return data.publicUrl;

    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload failed");
      return null;
    }
  };

  /* ================= LOAD STUDENTS ================= */

  const loadStudents = async () => {
    const { data } = await supabase
      .from("student_results")
      .select("*")
      .order("regno");

    setStudents(data || []);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  /* ================= LOAD SUBJECTS ================= */

  const loadSubjects = async (regno) => {
    const { data } = await supabase
      .from("student_results")
      .select("*")
      .eq("regno", regno)
      .order("semester");

    setSubjects(data || []);
  };

  /* ================= ADD STUDENT ================= */

  const addStudent = async () => {
  if (!studentForm.regno || !studentForm.name) {
    alert("Reg No and Name required");
    return;
  }

  let photoUrl = null;

  if (photo) {
    photoUrl = await uploadPhotoToSupabase(photo, studentForm.regno);
  }

  const { data, error } = await supabase
    .from("student_results")
    .insert([
      {
        ...studentForm,
        photo: photoUrl
      }
    ])
    .select(); // ✅ IMPORTANT

  if (error) {
    console.error(error);
    alert("Failed to add student");
    return;
  }

  // ✅ Update UI instantly (NO reload)
  setStudents(prev => [...prev, data[0]]);

  // reset form
  setStudentForm({ regno: "", name: "", department: "", year: "" });
  setPhoto(null);
};

  /* ================= EDIT STUDENT ================= */

  const startEditStudent = (s) => {
    setEditingStudentId(s.id);
    setEditStudentForm({
      regno: s.regno,
      name: s.name,
      department: s.department,
      year: s.year
    });
  };

  const updateStudent = async (id) => {
    let photoUrl = null;

    if (editPhoto) {
      photoUrl = await uploadPhotoToSupabase(editPhoto, editStudentForm.regno);
    }

    await supabase
      .from("student_results")
      .update({
        ...editStudentForm,
        photo: photoUrl || undefined
      })
      .eq("id", id);

    setEditingStudentId(null);
    setEditPhoto(null);
    loadStudents();
  };


  /* ================= DELETE STUDENT ================= */

  const deleteStudent = async (id, photoUrl) => {
    if (!window.confirm("Delete this student?")) return;

    if (photoUrl) {
      const fileName = photoUrl.split("/").pop();

      await supabase.storage
        .from("student-photos")
        .remove([fileName]);
    }

    await supabase
      .from("student_results")
      .delete()
      .eq("id", id);

    loadStudents();
  };


  /* ================= SELECT STUDENT ================= */

  const selectStudent = (s) => {
    setSelectedStudent(s);
    setSemesterFilter("");
    loadSubjects(s.regno);
  };

  /* ================= ADD SUBJECT ================= */

  const addSubject = async () => {
    if (!selectedStudent) return;

    const { semester, subject_code, subject_title } = subjectForm;

    if (!semester || !subject_code || !subject_title) {
      alert("Fill all subject fields");
      return;
    }

    const total =
      Number(subjectForm.ia || 0) +
      Number(subjectForm.ea || 0);

    await supabase.from("student_results").insert([
      {
        ...subjectForm,
        regno: selectedStudent.regno,
        name: selectedStudent.name,
        department: selectedStudent.department,
        year: selectedStudent.year,
        semester: Number(subjectForm.semester),
        ia: Number(subjectForm.ia || 0),
        ea: Number(subjectForm.ea || 0),
        total,
        result: total >= 50 ? "PASS" : "RA"
      }
    ]);

    loadSubjects(selectedStudent.regno);

    setSubjectForm({
      semester: "",
      subject_code: "",
      subject_title: "",
      ia: "",
      ea: ""
    });
  };

  /* ================= DELETE SUBJECT ================= */

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete subject?")) return;

    await supabase
      .from("student_results")
      .delete()
      .eq("id", id);

    loadSubjects(selectedStudent.regno);
  };

  /* ================= EDIT MARKS ================= */

  const startEditMarks = (sub) => {
    setEditingSubjectId(sub.id);
    setEditMarks({ ia: sub.ia, ea: sub.ea });
  };

  const updateMarks = async (id) => {
    const total =
      Number(editMarks.ia) +
      Number(editMarks.ea);

    await supabase
      .from("student_results")
      .update({
        ia: Number(editMarks.ia),
        ea: Number(editMarks.ea),
        total,
        result: total >= 50 ? "PASS" : "RA"
      })
      .eq("id", id);

    setEditingSubjectId(null);
    loadSubjects(selectedStudent.regno);
  };

  /* ================= FILTERS ================= */

  const filteredSubjects = semesterFilter
    ? subjects.filter(s => String(s.semester) === semesterFilter)
    : subjects;

  const filteredStudents = students.filter(s =>
    s.regno.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.department || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */

  return (
    <div className="card">
      <button onClick={() => navigate("/admin/dashboard")}>
        ← Back to Dashboard
      </button>

      <h3>Student & Subject Management</h3>

      {/* ADD STUDENT */}
      <h4>Add Student</h4>

      <input
        placeholder="Reg No"
        value={studentForm.regno}
        onChange={e =>
          setStudentForm({ ...studentForm, regno: e.target.value })
        }
      />

      <input
        placeholder="Name"
        value={studentForm.name}
        onChange={e =>
          setStudentForm({ ...studentForm, name: e.target.value })
        }
      />

      <input
        placeholder="Department"
        value={studentForm.department}
        onChange={e =>
          setStudentForm({ ...studentForm, department: e.target.value })
        }
      />

      <select
        value={studentForm.year}
        onChange={e =>
          setStudentForm({ ...studentForm, year: e.target.value })
        }
      >
        <option value="">Year</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];

          if (!file) return;

          // Basic validation
          if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file");
            return;
          }

          // Optional size limit (2MB)
          if (file.size > 2 * 1024 * 1024) {
            alert("Image size should be less than 2MB");
            return;
          }

          setPhoto(file);
        }}
      />


      <button onClick={addStudent}>Add Student</button>

      <hr />

      {/* SEARCH */}
      <input
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {editingStudentId && (
        <div className="edit-student">
          <h4>Edit Student</h4>

          <input
            value={editStudentForm.name}
            onChange={e =>
              setEditStudentForm({
                ...editStudentForm,
                name: e.target.value
              })
            }
          />

          <input
            value={editStudentForm.department}
            onChange={e =>
              setEditStudentForm({
                ...editStudentForm,
                department: e.target.value
              })
            }
          />

          <select
            value={editStudentForm.year}
            onChange={e =>
              setEditStudentForm({
                ...editStudentForm,
                year: e.target.value
              })
            }
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={e => setEditPhoto(e.target.files[0])}
          />

          <button onClick={() => updateStudent(editingStudentId)}>
            Update Student
          </button>

          <button onClick={() => setEditingStudentId(null)}>
            Cancel
          </button>
        </div>
      )}

      {/* STUDENTS TABLE */}
      <table>
        <tbody>
          {filteredStudents.map(s => (
            <React.Fragment key={s.id}>
              <tr>
                <td>{s.regno}</td>
                <td>{s.name}</td>
                <td>{s.department}</td>
                <td>{s.year}</td>

                <td>
                  <img
                    src={getPhotoUrl(s.photo)}
                    width="40"
                    height="40"
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default.png";
                    }}
                  />
                </td>

                <td>
                  <button onClick={() => selectStudent(s)}>
                    Manage
                  </button>

                  <button onClick={() => startEditStudent(s)}>
                    Edit
                  </button>

                  <button onClick={() => deleteStudent(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>

              {/* INLINE SUBJECT PANEL */}
              {selectedStudent?.id === s.id && (
                <tr>
                  <td colSpan="6">
                    <div className="manage-box">

                      <h4>Subjects - {s.name}</h4>

                      {/* SUBJECT ADD FORM */}
                      <div className="add-subject-row">
                        <input
                          placeholder="Semester"
                          onChange={e =>
                            setSubjectForm({ ...subjectForm, semester: e.target.value })
                          }
                        />

                        <input
                          placeholder="Code"
                          onChange={e =>
                            setSubjectForm({ ...subjectForm, subject_code: e.target.value })
                          }
                        />

                        <input
                          placeholder="Title"
                          onChange={e =>
                            setSubjectForm({ ...subjectForm, subject_title: e.target.value })
                          }
                        />

                        <input
                          placeholder="IA"
                          type="number"
                          onChange={e =>
                            setSubjectForm({ ...subjectForm, ia: e.target.value })
                          }
                        />

                        <input
                          placeholder="EA"
                          type="number"
                          onChange={e =>
                            setSubjectForm({ ...subjectForm, ea: e.target.value })
                          }
                        />

                        <button onClick={addSubject}>Add</button>
                      </div>

                      {/* SUBJECT MARKS TABLE */}
                      <table className="inner-table">
                        <thead>
                          <tr>
                            <th>Semester</th>
                            <th>Code</th>
                            <th>Title</th>
                            <th>IA</th>
                            <th>EA</th>
                            <th>Total</th>
                            <th>Result</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {subjects.map(sub => (
                            <tr key={sub.id}>
                              <td>{sub.semester}</td>
                              <td>{sub.subject_code}</td>
                              <td>{sub.subject_title}</td>
                              <td>{sub.ia}</td>
                              <td>{sub.ea}</td>
                              <td>{sub.total}</td>
                              <td>{sub.result}</td>

                              <td>
                                <button onClick={() => startEditMarks(sub)}>
                                  Edit
                                </button>

                                <button onClick={() => deleteSubject(sub.id)}>
                                  Delete
                                </button>


                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>


      {/* SUBJECTS */}
      {selectedStudent && (
        <>
          <h4>Subjects - {selectedStudent.name}</h4>

          <input
            placeholder="Semester"
            onChange={e =>
              setSubjectForm({ ...subjectForm, semester: e.target.value })
            }
          />

          <input
            placeholder="Code"
            onChange={e =>
              setSubjectForm({ ...subjectForm, subject_code: e.target.value })
            }
          />

          <input
            placeholder="Title"
            onChange={e =>
              setSubjectForm({ ...subjectForm, subject_title: e.target.value })
            }
          />

          <input
            placeholder="IA"
            type="number"
            onChange={e =>
              setSubjectForm({ ...subjectForm, ia: e.target.value })
            }
          />

          <input
            placeholder="EA"
            type="number"
            onChange={e =>
              setSubjectForm({ ...subjectForm, ea: e.target.value })
            }
          />

          <button onClick={addSubject}>Add Subject</button>
        </>
      )}
      <ScrollButton />
    </div>
  );
}
