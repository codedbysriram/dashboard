import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StudentDashboard.css";

const getTotalMarks = s => Number(s.total_marks || 0);

export default function StudentsHome() {

  /* ================= STATE ================= */
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  

  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [arrear, setArrear] = useState("");
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");

  const [nameSort, setNameSort] = useState("");
  const [regnoSort, setRegnoSort] = useState("");

  const navigate = useNavigate();

  /* ================= BOARD ROLE ================= */
  const getBoardRole = (year, rank) => {
    if (year === 1 && rank === 1) return "Treasurer";
    if (year === 2 && rank === 1) return "Secretary";
    if (year === 2 && rank === 2) return "Joint Secretary";
    if (year === 3 && rank === 1) return "Chairman";
    if (year === 3 && rank === 2) return "Vice Chairman";
    return "-";
  };

  /* ================= FETCH SUBJECT LIST ================= */
  useEffect(() => {
    let url = "http://localhost:5000/api/subjects";
    if (year) url += `?year=${year}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setSubjects(Array.isArray(data) ? data : []))
      .catch(err => console.error("Subject fetch error:", err));
  }, [year]);

  /* ================= FETCH STUDENTS ================= */
  useEffect(() => {
    let url = "http://localhost:5000/api/results?";
    if (year) url += `year=${year}&`;
    if (semester) url += `semester=${semester}&`;
    if (subject) url += `subject=${encodeURIComponent(subject)}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []))
      .catch(err => console.error("Student fetch error:", err));
  }, [year, semester, subject]);

  /* ================= FILTER + RANK ================= */
  const filteredStudents = (() => {

    // FILTER
    const base = students.filter(s => {
      const arrears = Number(s.arrears || 0);

      const arrearMatch =
        arrear === "" ||
        (arrear === "0" && arrears === 0) ||
        (arrear === "1" && arrears === 1) ||
        (arrear === "2" && arrears === 2) ||
        (arrear === "3" && arrears >= 3);

      const searchMatch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.regno.toLowerCase().includes(search.toLowerCase());

      return arrearMatch && searchMatch;
    });

    // SUBJECT PAGE → MARKS RANK
    if (subject) {
      return [...base]
        .sort((a, b) => (b.marks || 0) - (a.marks || 0))
        .map((s, i) => ({ ...s, position: i + 1 }));
    }

    // HOME PAGE → CGPA RANK (WITH TIE BREAK)
    const groupedByYear = base.reduce((acc, s) => {
      acc[s.year] = acc[s.year] || [];
      acc[s.year].push(s);
      return acc;
    }, {});

    const ranked = [];

    Object.values(groupedByYear).forEach(group => {
      const sorted = [...group].sort((a, b) => {
        if (b.cgpa !== a.cgpa) return b.cgpa - a.cgpa;
        if (getTotalMarks(b) !== getTotalMarks(a))
          return getTotalMarks(b) - getTotalMarks(a);
        return a.regno.localeCompare(b.regno);
      });

      sorted.forEach((s, i) => ranked.push({ ...s, rank: i + 1 }));
    });

    return ranked;
  })();

  /* ================= FINAL SORT (NAME / REGNO) ================= */
  const finalStudents = (() => {
    let list = [...filteredStudents];

    if (nameSort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    if (nameSort === "za") list.sort((a, b) => b.name.localeCompare(a.name));

    if (regnoSort === "asc") list.sort((a, b) => a.regno.localeCompare(b.regno));
    if (regnoSort === "desc") list.sort((a, b) => b.regno.localeCompare(a.regno));

    return list;
  })();

  /* ================= UI ================= */
  return (
    <div className="dashboard-container">

      {/* TOP BAR */}
      <div className="top-bar-student">
        <h3>Student Result Dashboard</h3>
        <div className="top-actions">
          <button onClick={() => navigate("/board-members")}>Board Members</button>
          <button className="admin-login-btn" onClick={() => navigate("/admin")}>
            Admin Login
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters">

        <input
          type="text"
          placeholder="Search by name / reg no"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select value={year} onChange={e => {
          setYear(e.target.value);
          setSemester("");
          setSubject("");
        }}>
          <option value="">Select Year</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
        </select>

        <select value={semester} onChange={e => setSemester(e.target.value)}>
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6].map(s => (
            <option key={s} value={s}>Sem {s}</option>
          ))}
        </select>

        <select value={arrear} onChange={e => setArrear(e.target.value)}>
          <option value="">All</option>
          <option value="0">Without Arrear</option>
          <option value="1">1 Arrear</option>
          <option value="2">2 Arrears</option>
          <option value="3">3+ Arrears</option>
        </select>

        <select value={subject} onChange={e => setSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {subjects.map((s, i) => (
            <option key={i} value={s.subject_title}>
              {s.subject_title}
            </option>
          ))}
        </select>

        <select value={nameSort} onChange={e => {
          setNameSort(e.target.value);
          setRegnoSort("");
        }}>
          <option value="">Name Sort</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>

        <select value={regnoSort} onChange={e => {
          setRegnoSort(e.target.value);
          setNameSort("");
        }}>
          <option value="">Reg No Sort</option>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Profile</th>
              <th>Reg No</th>
              <th>Name</th>
              <th>Year</th>
              <th>{subject ? "Position" : "Arrears"}</th>
              <th>{subject ? "Marks" : "Board Member"}</th>
              <th>{subject ? "GPA" : "CGPA"}</th>
            </tr>
          </thead>


          <tbody>
            {finalStudents.map((s, index) => (
              <tr key={s.regno}>

                {/* S.NO */}
                <td>{index + 1}</td>

                {/* ✅ PROFILE IMAGE */}
                <td>
                  <img
                    src={
                      s.photo && s.photo.trim() !== ""
                        ? `http://localhost:5000/uploads/${s.photo}?v=${s.regno}`
                        : "/default-avatar.png"
                    }
                    className={
                      subject
                        ? s.position === 1
                          ? "profile-img topper-img"
                          : "profile-img"
                        : s.rank === 1
                          ? "profile-img topper-img"
                          : "profile-img"
                    }
                    alt={s.name}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                </td>

                {/* REG NO */}
                <td className={subject ? (s.position === 1 ? "topper-text" : "") : (s.rank === 1 ? "topper-text" : "")}>
                  {s.regno}
                </td>

                {/* NAME */}
                <td className={subject ? (s.position === 1 ? "topper-text" : "") : (s.rank === 1 ? "topper-text" : "")}>
                  {s.name}
                </td>

                {/* YEAR */}
                <td>{s.year}</td>

                {/* POSITION / ARREARS */}
                <td className={subject ? "position" : s.arrears > 0 ? "arrear" : "clear"}>
                  {subject ? s.position : s.arrears}
                </td>

                {/* MARKS / BOARD */}
                <td>
                  {subject ? s.marks : getBoardRole(Number(s.year), s.rank)}
                </td>

                {/* GPA / CGPA */}
                <td>
                  {subject ? s.gpa : s.cgpa}
                </td>

              </tr>
            ))}
          </tbody>

        </table>

        {finalStudents.length === 0 && (
          <p className="no-data">No students found</p>
        )}
      </div>
    </div>
  );
}
