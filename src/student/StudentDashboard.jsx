import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StudentDashboard.css";
import { supabase } from "../supabaseClient";



/* ✅ Group subject rows into one student record */
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
        arrears: 0,
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
      subject_title: r.subject_title,
      total: marks,
      result: r.result,
      gpa: gpa,
    });

    if (isArrear) {
      student.arrears += 1;
    }
  });

  const result = Array.from(map.values());

  // 🔥 CORRECT CGPA CALCULATION
  result.forEach((student) => {
    const validGpas = student.subjects
      .map((s) => s.gpa)
      .filter((g) => g !== null);

    if (validGpas.length > 0) {
      const avg =
        validGpas.reduce((a, b) => a + b, 0) / validGpas.length;

      student.cgpa = avg.toFixed(2);
    } else {
      student.cgpa = "-";
    }
  });

  return result;
};

export default function StudentsHome() {
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
  const assignBoardMembersByCgpa = (students) => {
    const yearGroups = {
      1: [],
      2: [],
      3: []
    };

    // Group students by year
    students.forEach((s) => {
      if (s.year && yearGroups[s.year]) {
        yearGroups[s.year].push(s);
      }
    });

    // Sort each year by CGPA (high → low)
    Object.keys(yearGroups).forEach((year) => {
      yearGroups[year].sort((a, b) => Number(b.cgpa) - Number(a.cgpa));
    });

    const boardMap = new Map();

    // Assign roles based on CGPA rank
    if (yearGroups[1]?.length) {
      boardMap.set(yearGroups[1][0].regno, "Treasurer");
    }

    if (yearGroups[2]?.length) {
      boardMap.set(yearGroups[2][0].regno, "Secretary");

      if (yearGroups[2][1]) {
        boardMap.set(yearGroups[2][1].regno, "Joint Secretary");
      }
    }

    if (yearGroups[3]?.length) {
      boardMap.set(yearGroups[3][0].regno, "Chairman");

      if (yearGroups[3][1]) {
        boardMap.set(yearGroups[3][1].regno, "Vice Chairman");
      }
    }

    return boardMap;
  };

  /* ✅ Fetch subjects (year + semester wise) */
  useEffect(() => {
    const fetchSubjectsFromResults = async () => {
      let query = supabase
        .from("student_results")
        .select("subject_title");

      if (year) query = query.eq("year", year);
      if (semester) query = query.eq("semester", semester);

      const { data, error } = await query;

      if (error) {
        console.error("Subject fetch error:", error);
        return;
      }

      const unique = [
        ...new Set((data || []).map((d) => d.subject_title))
      ];

      setSubjects(unique.map((s) => ({ subject_title: s })));
    };

    fetchSubjectsFromResults();
  }, [year, semester]);


  /* ✅ Fetch results */
  useEffect(() => {
    const fetchResults = async () => {
      console.log("🔍 Fetching RAW data from Supabase...");

      const { data, error } = await supabase
        .from("student_results")
        .select("*");

      console.log("RAW SUPABASE DATA:", data);

      if (error) {
        console.error("Student fetch error:", error);
      } else {
        const grouped = groupStudentRows(data || []);
        setStudents(grouped);
      }
    };

    fetchResults();

  }, []);


  /* ================= FILTER + RANK ================= */
  const filteredStudents = useMemo(() => {
    let base = [...students];

    // ✅ Search + arrear filter
    base = base.filter((s) => {
      const arrears = Number(s.arrears || 0);

      const arrearMatch =
        arrear === "" ||
        (arrear === "0" && arrears === 0) ||
        (arrear === "1" && arrears === 1) ||
        (arrear === "2" && arrears === 2) ||
        (arrear === "3" && arrears >= 3);

      const searchMatch =
        (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.regno || "").toLowerCase().includes(search.toLowerCase());

      return arrearMatch && searchMatch;
    });

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
            arrears: 0,
            cgpa: 0,
          });
        }

        const student = map.get(r.regno);

        const marks = r.total ? Number(r.total) : null;
        const status = (r.result || "").toUpperCase();
        const isArrear = status === "RA" || status === "AA";

        // GPA for this subject
        let gpa = null;

        if (marks !== null) {
          gpa = isArrear ? 0 : Number((marks / 10).toFixed(1));
        }

        student.subjects.push({
          subject_title: r.subject_title,
          total: marks,
          result: r.result,
          gpa: gpa,
        });

        // count arrears
        if (isArrear) {
          student.arrears += 1;
        }
      });

      const result = Array.from(map.values());

      // 🔥 ACTUAL CGPA CALCULATION
      result.forEach((student) => {
        const validGpas = student.subjects
          .map((s) => s.gpa)
          .filter((g) => g !== null);

        if (validGpas.length > 0) {
          const avg =
            validGpas.reduce((a, b) => a + b, 0) / validGpas.length;

          student.cgpa = avg.toFixed(2);
        } else {
          student.cgpa = "-";
        }
      });

      return result;
    };

    // ✅ If subject selected → calculate marks & position
    if (subject) {
      const ranked = base
        .map((s) => {
          const subRow = s.subjects.find((x) => x.subject_title === subject);

          const marks =
            subRow?.total && /^\d+$/.test(subRow.total)
              ? Number(subRow.total)
              : null;

          const status = (subRow?.result || "").toUpperCase();
          const isArrear = status === "RA" || status === "AA";

          let gpa = "-";

          if (marks !== null) {
            gpa = isArrear ? "0.0" : (marks / 10).toFixed(1);
          }

          return {
            ...s,
            marks,
            gpa
          };
        })
        .sort((a, b) => (b.marks || 0) - (a.marks || 0))
        .map((s, i) => ({
          ...s,
          position: i + 1,
          gpa: s.gpa

        }));

      return ranked;
    }


    // ✅ Normal view (rank based on arrears low)
    const rankedByArrears = [...base].sort(
      (a, b) => Number(a.arrears || 0) - Number(b.arrears || 0)
    );

    return rankedByArrears.map((s, i) => ({ ...s, rank: i + 1 }));
  }, [students, arrear, search, subject]);

  /* ================= FINAL SORT ================= */
  const finalStudents = useMemo(() => {
    let list = [...filteredStudents];

    if (nameSort === "az") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (nameSort === "za") list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));

    if (regnoSort === "asc") list.sort((a, b) => (a.regno || "").localeCompare(b.regno || ""));
    if (regnoSort === "desc") list.sort((a, b) => (b.regno || "").localeCompare(a.regno || ""));

    return list;
  }, [filteredStudents, nameSort, regnoSort]);

  const boardMembers = assignBoardMembersByCgpa(students);

  const studentsWithPhotos = useMemo(() => {
    return finalStudents.map((s) => {
      let finalPhoto = "/default.png";

      if (s.photo && s.photo.trim() !== "") {
        if (s.photo.startsWith("http")) {
          finalPhoto = s.photo;
        } else {
          finalPhoto = supabase.storage
            .from("student-photos")
            .getPublicUrl(s.photo).data.publicUrl;
        }
      }

      return {
        ...s,
        displayPhoto: finalPhoto
      };
    });
  }, [finalStudents]);

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
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* YEAR */}
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setSemester("");
            setSubject("");
          }}
        >
          <option value="">Select Year</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
        </select>

        {/* SEM */}
        <select
          value={semester}
          onChange={(e) => {
            setSemester(e.target.value);
            setSubject("");
          }}
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>
              Sem {s}
            </option>
          ))}
        </select>

        {/* ARREAR */}
        <select value={arrear} onChange={(e) => setArrear(e.target.value)}>
          <option value="">All</option>
          <option value="0">Without Arrear</option>
          <option value="1">1 Arrear</option>
          <option value="2">2 Arrears</option>
          <option value="3">3+ Arrears</option>
        </select>

        {/* SUBJECT */}
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.subject_title} value={s.subject_title}>
              {s.subject_title}
            </option>
          ))}
        </select>

        {/* NAME SORT */}
        <select
          value={nameSort}
          onChange={(e) => {
            setNameSort(e.target.value);
            setRegnoSort("");
          }}
        >
          <option value="">Name Sort</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>

        {/* REGNO SORT */}
        <select
          value={regnoSort}
          onChange={(e) => {
            setRegnoSort(e.target.value);
            setNameSort("");
          }}
        >
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
                <td>{index + 1}</td>

                <td>
                  <img
                    src={
                      supabase.storage
                        .from("student-photos")
                        .getPublicUrl(`${s.regno}.jpg`).data.publicUrl
                    }
                    className="profile-img"
                    alt={s.name}
                    onError={(e) => {
                      e.target.onerror = null;

                      // Try png if jpg not found
                      e.target.src = supabase.storage
                        .from("student-photos")
                        .getPublicUrl(`${s.regno}.png`).data.publicUrl;

                      // If png also fails → default
                      e.target.onerror = () => {
                        e.target.src = "/default.png";
                      };
                    }}
                  />




                </td>


                <td>{s.regno}</td>
                <td>{s.name}</td>
                <td>{s.year}</td>

                <td>{subject ? s.position : s.arrears}</td>

                <td>
                  {subject
                    ? s.marks === null
                      ? "-"
                      : s.marks
                    : boardMembers.get(s.regno) || "-"}
                </td>

                <td>{subject ? s.gpa : s.cgpa}</td>

              </tr>
            ))}
          </tbody>
        </table>

        {finalStudents.length === 0 && <p className="no-data">No students found</p>}
      </div>
    </div>
  );
}
