import React, { useEffect, useState } from "react";
import "../styles/BoardMembers.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/* ===== GROUP STUDENT ROWS + CALCULATE CGPA ===== */
const groupStudentRows = (rows) => {
  const map = new Map();

  rows.forEach((r) => {
    if (!r.regno) return;

    if (!map.has(r.regno)) {
      map.set(r.regno, {
        regno: r.regno,
        name: r.name || "",
        year: r.year || "",
        photo: r.photo || "",
        subjects: [],
        cgpa: 0,
      });
    }

    const student = map.get(r.regno);

    const marks = r.total ? Number(r.total) : null;
    const status = (r.result || "").toUpperCase();
    const isArrear = status === "RA" || status === "AA";

    let gpa = null;

    if (marks !== null) {
      gpa = isArrear ? 0 : Number((marks / 10).toFixed(1));
    }

    student.subjects.push({
      semester: r.semester,
      subject_code: r.subject_code,
      subject_title: r.subject_title,
      ia: r.ia,
      ea: r.ea,
      total: marks,
      result: r.result,
      gpa: gpa,
    });
  });

  const result = Array.from(map.values());

  // 🔥 CGPA CALCULATION
  result.forEach((student) => {
    const validGpas = student.subjects
      .map((s) => s.gpa)
      .filter((g) => g !== null);

    if (validGpas.length > 0) {
      const avg =
        validGpas.reduce((a, b) => a + b, 0) / validGpas.length;

      student.cgpa = avg.toFixed(2);
    } else {
      student.cgpa = "0.00";
    }
  });

  return result;
};

/* ===== ASSIGN BOARD ROLES BY CGPA ===== */
const assignBoardMembersByCgpa = (students) => {
  const yearGroups = {
    1: [],
    2: [],
    3: []
  };

  students.forEach((s) => {
    if (s.year && yearGroups[s.year]) {
      yearGroups[s.year].push(s);
    }
  });

  Object.keys(yearGroups).forEach((year) => {
    yearGroups[year].sort((a, b) => Number(b.cgpa) - Number(a.cgpa));
  });

  const boardList = [];

  if (yearGroups[1]?.length) {
    boardList.push({
      ...yearGroups[1][0],
      role: "Treasurer",
    });
  }

  if (yearGroups[2]?.length) {
    boardList.push({
      ...yearGroups[2][0],
      role: "Secretary",
    });

    if (yearGroups[2][1]) {
      boardList.push({
        ...yearGroups[2][1],
        role: "Joint Secretary",
      });
    }
  }

  if (yearGroups[3]?.length) {
    boardList.push({
      ...yearGroups[3][0],
      role: "Chairman",
    });

    if (yearGroups[3][1]) {
      boardList.push({
        ...yearGroups[3][1],
        role: "Vice Chairman",
      });
    }
  }

  return boardList;
};

export default function BoardMembers() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const getPhotoUrl = (regno) => {
    return supabase.storage
      .from("student-photos")
      .getPublicUrl(`${regno}.jpg`).data.publicUrl;
  };


  const openStudentPopup = (student) => {
    setSelectedStudent(student);
  };

  const closePopup = () => {
    setSelectedStudent(null);
  };

  useEffect(() => {
    const loadBoardMembers = async () => {
      const { data, error } = await supabase
        .from("student_results")
        .select("*");

      if (error) {
        console.error("Board fetch error:", error);
        return;
      }

      const grouped = groupStudentRows(data || []);

      const board = assignBoardMembersByCgpa(grouped);

      setMembers(board);
    };

    loadBoardMembers();
  }, []);

  return (
    <div className="board-container">
      <button className="back-bn" onClick={() => navigate("/")}>
        ← Back to Dashboard
      </button>

      <h2>Student Board Members</h2>

      <div className="board-grid">
        {members.map((m) => (
          <div
            key={m.regno}
            className="board-card"
            onClick={() => openStudentPopup(m)}
          >
            <img
              src={getPhotoUrl(m.regno)}
              alt={m.name}
              onError={(e) => {
                e.target.onerror = null;

                // Try PNG if JPG not found
                e.target.src = supabase.storage
                  .from("student-photos")
                  .getPublicUrl(`${m.regno}.png`).data.publicUrl;

                // If both fail → default image
                e.target.onerror = () => {
                  e.target.src = "/default-avatar.png";
                };
              }}
            />


            <h4>{m.name}</h4>
            <p>{m.regno}</p>

            <span className="role">{m.role}</span>

            <span className="cgpa">CGPA: {m.cgpa}</span>
          </div>
        ))}
      </div>

      {selectedStudent && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePopup}>
              ✖
            </button>

            <h2>{selectedStudent.name}</h2>
            <h4>CGPA: {selectedStudent.cgpa}</h4>

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
                {selectedStudent.subjects.map((s, i) => (
                  <tr key={i}>
                    <td>{s.semester}</td>
                    <td>{s.subject_code}</td>
                    <td>{s.subject_title}</td>
                    <td>{s.ia}</td>
                    <td>{s.ea}</td>
                    <td>{s.total}</td>
                    <td>{s.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedStudent.subjects.length === 0 && (
              <p>No marks found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
