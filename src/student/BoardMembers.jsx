import React, { useEffect, useState } from "react";
import "../styles/BoardMembers.css";




export default function BoardMembers() {
  const [members, setMembers] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);

  const formatRank = r => {
    if (r === 1) return "1st";
    if (r === 2) return "2nd";
    if (r === 3) return "3rd";
    return `${r}th`;
  };


  const openStudentPopup = student => {
    setSelectedStudent(student);

    fetch(`http://localhost:5000/api/results/${student.regno}`)
      .then(res => res.json())
      .then(data => setSubjects(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Subject fetch failed:", err);
        setSubjects([]);
      });
  };

  const closePopup = () => {
    setSelectedStudent(null);
    setSubjects([]);
  };
  useEffect(() => {
    fetch("http://localhost:5000/api/results")
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;

        // 1️⃣ Group by year
        const grouped = data.reduce((acc, s) => {
          acc[s.year] = acc[s.year] || [];
          acc[s.year].push(s);
          return acc;
        }, {});

        // 2️⃣ Rank year-wise by CGPA
        const ranked = [];

        Object.values(grouped).forEach(group => {
          const sorted = [...group].sort((a, b) => {
            if (b.cgpa !== a.cgpa) return b.cgpa - a.cgpa;
            return a.regno.localeCompare(b.regno); // tie-break
          });

          sorted.forEach((s, i) => {
            ranked.push({ ...s, rank: i + 1 });
          });
        });

        // 3️⃣ Pick only board members
        const board = ranked.filter(s => {
          if (s.year === 1 && s.rank === 1) return true;
          if (s.year === 2 && (s.rank === 1 || s.rank === 2)) return true;
          if (s.year === 3 && (s.rank === 1 || s.rank === 2)) return true;
          return false;
        });

        setMembers(board);
      });
  }, []);


  const getRole = (year, rank) => {
    if (year === 1 && rank === 1) return "Treasurer";
    if (year === 2 && rank === 1) return "Secretary";
    if (year === 2 && rank === 2) return "Joint Secretary";
    if (year === 3 && rank === 1) return "Chairman";
    if (year === 3 && rank === 2) return "Vice Chairman";
    return "";
  };

  return (
    <div className="board-container">
      <h2>Student Board Members</h2>

      <div className="board-grid">
        {members.map(m => (
          <div
            key={m.regno}
            className="board-card"
            onClick={() => openStudentPopup(m)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={
                m.photo
                  ? `http://localhost:5000/uploads/${m.photo}`
                  : "/default-avatar.png"
              }
              alt={m.name}
            />
            <h4>{m.name}</h4>
            <p>{m.regno}</p>
            <span className="role">{getRole(Number(m.year), m.rank)}</span>
          </div>
        ))}
      </div>
      {/* ===== STUDENT DETAILS POPUP ===== */}
      {selectedStudent && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-card" onClick={e => e.stopPropagation()}>

            <button className="close-btn" onClick={closePopup}>✖</button>

            {/* ===== POPUP HEADER ===== */}
            <div className="popup-header">
              <div className="profile-section">
                <img
                  src={
                    selectedStudent.photo
                      ? `http://localhost:5000/uploads/${selectedStudent.photo}`
                      : "/default-avatar.png"
                  }
                  alt={selectedStudent.name}
                  className="profile-pic"
                />

                <div className="profile-info">
                  <h2>{selectedStudent.name}</h2>
                  <p>Reg No: {selectedStudent.regno}</p>
                  <p>Year: {selectedStudent.year}</p>
                  <p className="role-text">
                    {getRole(Number(selectedStudent.year), selectedStudent.rank)}
                  </p>
                </div>
              </div>

              <div className="academic-summary">
                <div className="summary-box">
                  <span>CGPA</span>
                  <strong>{selectedStudent.cgpa}</strong>
                </div>

                <div className="summary-box">
                  <span>Position</span>
                  <strong>{selectedStudent.rank}</strong>
                </div>
              </div>
            </div>

            {/* ===== MARKS TABLE ===== */}
            <table>
              <thead>
                <tr>
                  <th>Sem</th>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>IA</th>
                  <th>EA</th>
                  <th>Total</th>
                  <th>Result</th>
                </tr>
              </thead>

              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td>{s.semester}</td>
                    <td>{s.subject_code}</td>
                    <td>{s.subject_title}</td>
                    <td>{s.ia}</td>
                    <td>{s.ea}</td>
                    <td>{s.total}</td>
                    <td className={s.result === "PASS" ? "pass" : "fail"}>
                      {s.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {subjects.length === 0 && <p>No marks found</p>}
          </div>
        </div>
      )}

    </div>
  );
}
