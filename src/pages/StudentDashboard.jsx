import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabaseClient';

function StudentDashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeView, setActiveView] = useState('available-courses');
    const [expandedCourseId, setExpandedCourseId] = useState(null);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState(null);
    const [studentEmail, setStudentEmail] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [enrollingCourseId, setEnrollingCourseId] = useState(null);
    const [enrollmentStatus, setEnrollmentStatus] = useState({});
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
    const [enrollmentsError, setEnrollmentsError] = useState(null);
    const [approvedCourses, setApprovedCourses] = useState([]);
    const [courseInfoLoading, setCourseInfoLoading] = useState(true);
    const [courseInfoError, setCourseInfoError] = useState(null);
    const [courseStudents, setCourseStudents] = useState({});
    const [studentsLoading, setStudentsLoading] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAvailableCourses = async () => {
            setCoursesLoading(true);
            setCoursesError(null);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setStudentEmail(user.email || '');
                    setCurrentUserId(user.id);
                }

                const { data: coursesData, error: coursesError } = await supabase
                    .from('courses')
                    .select('course_id, course_name, faculty_id, created_at, status')
                    .eq('status', 'approved')
                    .order('created_at', { ascending: false });

                if (coursesError) {
                    console.error('Courses error:', coursesError);
                    setCoursesError('Failed to load courses.');
                    setCoursesLoading(false);
                    return;
                }

                const facultyIds = (coursesData || []).map(c => c.faculty_id).filter(Boolean);
                let facultyMap = {};

                if (facultyIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, username')
                        .in('id', facultyIds);

                    if (profilesError) {
                        console.error('Profiles error:', profilesError);
                    } else {
                        facultyMap = (profilesData || []).reduce((acc, p) => {
                            acc[p.id] = p.username;
                            return acc;
                        }, {});
                    }
                }

                const coursesWithFaculty = (coursesData || []).map(course => ({
                    ...course,
                    faculty_name: facultyMap[course.faculty_id] || null
                }));

                setAvailableCourses(coursesWithFaculty);
            } catch (err) {
                console.error('Courses error:', err);
                setCoursesError('An unexpected error occurred.');
            }

            setCoursesLoading(false);
        };

        fetchAvailableCourses();
    }, []);

    useEffect(() => {
        const fetchMyEnrollments = async () => {
            setEnrollmentsLoading(true);
            setEnrollmentsError(null);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setEnrollmentsError('Not authenticated.');
                    setEnrollmentsLoading(false);
                    return;
                }

                const { data: enrollmentsData, error: enrollmentsError } = await supabase
                    .from('enrollments')
                    .select(`
                        enrollment_id,
                        status,
                        enrolled_at,
                        course_id,
                        courses!inner(course_name, faculty_id)
                    `)
                    .eq('student_id', user.id)
                    .order('enrolled_at', { ascending: false });

                if (enrollmentsError) {
                    console.error('Enrollments error:', enrollmentsError);

                    const { data: fallbackEnrollments, error: fallbackError } = await supabase
                        .from('enrollments')
                        .select('enrollment_id, course_id, status, enrolled_at')
                        .eq('student_id', user.id)
                        .order('enrolled_at', { ascending: false });

                    if (fallbackError) {
                        console.error('Enrollments error:', fallbackError);
                        setEnrollmentsError('Failed to load enrollments.');
                        setEnrollmentsLoading(false);
                        return;
                    }

                    const courseIds = (fallbackEnrollments || []).map(e => e.course_id).filter(Boolean);
                    let courseMap = {};

                    if (courseIds.length > 0) {
                        const { data: coursesData, error: coursesErr } = await supabase
                            .from('courses')
                            .select('course_id, course_name')
                            .in('course_id', courseIds);

                        if (!coursesErr && coursesData) {
                            courseMap = coursesData.reduce((acc, c) => {
                                acc[c.course_id] = c.course_name;
                                return acc;
                            }, {});
                        }
                    }

                    const mergedEnrollments = (fallbackEnrollments || []).map(enrollment => ({
                        ...enrollment,
                        courseName: courseMap[enrollment.course_id] || 'Unknown Course'
                    }));

                    setMyEnrollments(mergedEnrollments);
                } else {
                    const formattedEnrollments = (enrollmentsData || []).map(enrollment => ({
                        ...enrollment,
                        courseName: enrollment.courses?.course_name || 'Unknown Course'
                    }));

                    setMyEnrollments(formattedEnrollments);
                }
            } catch (err) {
                console.error('Enrollments error:', err);
                setEnrollmentsError('An unexpected error occurred.');
            }

            setEnrollmentsLoading(false);
        };

        fetchMyEnrollments();
    }, []);

    useEffect(() => {
        const fetchApprovedCourses = async () => {
            setCourseInfoLoading(true);
            setCourseInfoError(null);

            try {
                const { data, error } = await supabase
                    .from('courses')
                    .select('course_id, course_name, created_at')
                    .eq('status', 'approved')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Approved courses error:', error);
                    setCourseInfoError('Failed to load courses.');
                } else {
                    setApprovedCourses(data || []);
                }
            } catch (err) {
                console.error('Approved courses error:', err);
                setCourseInfoError('An unexpected error occurred.');
            }

            setCourseInfoLoading(false);
        };

        fetchApprovedCourses();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleNavClick = (view) => {
        setDrawerOpen(false);
        setActiveView(view);
    };

    const handleEnroll = async (courseId) => {
        if (!currentUserId) {
            setEnrollmentStatus(prev => ({
                ...prev,
                [courseId]: { type: 'error', message: 'Not authenticated.' }
            }));
            return;
        }

        setEnrollingCourseId(courseId);
        setEnrollmentStatus(prev => ({
            ...prev,
            [courseId]: { type: '', message: '' }
        }));

        try {
            const { data: existingEnrollment, error: checkError } = await supabase
                .from('enrollments')
                .select('enrollment_id')
                .eq('course_id', courseId)
                .eq('student_id', currentUserId)
                .maybeSingle();

            if (checkError) {
                console.error('Enroll error:', checkError);
                setEnrollmentStatus(prev => ({
                    ...prev,
                    [courseId]: { type: 'error', message: 'Failed to submit enrollment.' }
                }));
                setEnrollingCourseId(null);
                return;
            }

            if (existingEnrollment) {
                setEnrollmentStatus(prev => ({
                    ...prev,
                    [courseId]: { type: 'warning', message: 'You have already requested enrollment.' }
                }));
                setEnrollingCourseId(null);
                return;
            }

            const { error: insertError } = await supabase
                .from('enrollments')
                .insert({
                    course_id: courseId,
                    student_id: currentUserId,
                    status: 'pending'
                });

            if (insertError) {
                console.error('Enroll error:', insertError);
                setEnrollmentStatus(prev => ({
                    ...prev,
                    [courseId]: { type: 'error', message: 'Failed to submit enrollment.' }
                }));
            } else {
                setEnrollmentStatus(prev => ({
                    ...prev,
                    [courseId]: { type: 'success', message: 'Enrollment request submitted.' }
                }));
            }
        } catch (err) {
            console.error('Enroll error:', err);
            setEnrollmentStatus(prev => ({
                ...prev,
                [courseId]: { type: 'error', message: 'Failed to submit enrollment.' }
            }));
        }

        setEnrollingCourseId(null);
    };

    const toggleCourseExpand = async (courseId) => {
        if (expandedCourseId === courseId) {
            setExpandedCourseId(null);
            return;
        }

        setExpandedCourseId(courseId);

        if (courseStudents[courseId]) {
            return;
        }

        setStudentsLoading(courseId);

        try {
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    enrollment_id,
                    student_id,
                    enrolled_at,
                    profiles!inner(id, username)
                `)
                .eq('course_id', courseId)
                .eq('status', 'approved');

            if (error) {
                console.error('Enrollments error:', error);

                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('enrollments')
                    .select('enrollment_id, student_id, enrolled_at')
                    .eq('course_id', courseId)
                    .eq('status', 'approved');

                if (fallbackError) {
                    console.error('Enrollments error:', fallbackError);
                    setCourseStudents(prev => ({
                        ...prev,
                        [courseId]: { error: true, students: [] }
                    }));
                } else {
                    const studentIds = (fallbackData || []).map(e => e.student_id).filter(Boolean);
                    let profileMap = {};

                    if (studentIds.length > 0) {
                        const { data: profilesData } = await supabase
                            .from('profiles')
                            .select('id, username')
                            .in('id', studentIds);

                        if (profilesData) {
                            profileMap = profilesData.reduce((acc, p) => {
                                acc[p.id] = p.username;
                                return acc;
                            }, {});
                        }
                    }

                    const students = (fallbackData || []).map(e => ({
                        id: e.enrollment_id,
                        name: profileMap[e.student_id] || 'Unknown Student',
                        enrolledAt: e.enrolled_at
                    }));

                    setCourseStudents(prev => ({
                        ...prev,
                        [courseId]: { error: false, students }
                    }));
                }
            } else {
                const students = (data || []).map(e => ({
                    id: e.enrollment_id,
                    name: e.profiles?.username || 'Unknown Student',
                    enrolledAt: e.enrolled_at
                }));

                setCourseStudents(prev => ({
                    ...prev,
                    [courseId]: { error: false, students }
                }));
            }
        } catch (err) {
            console.error('Enrollments error:', err);
            setCourseStudents(prev => ({
                ...prev,
                [courseId]: { error: true, students: [] }
            }));
        }

        setStudentsLoading(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'text-green-600 bg-green-50';
            case 'pending':
                return 'text-orange-600 bg-orange-50';
            case 'rejected':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 shadow-sm">
                <div className="h-full px-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setDrawerOpen(!drawerOpen)}
                            className="text-gray-500 hover:text-orange-500 transition-colors p-1 lg:hidden"
                        >
                            <span className="text-xl">{drawerOpen ? '✕' : '☰'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-gray-800">LMS Student</span>
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600 hidden sm:block truncate max-w-48">
                            {studentEmail}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-500 hover:text-red-600 transition-colors font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {drawerOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-20 z-30 lg:hidden"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            <aside
                className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-60 bg-white border-r border-gray-100 z-40 transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            >
                <div className="p-5 pt-6">
                    <nav className="space-y-1">
                        <button
                            onClick={() => handleNavClick('available-courses')}
                            className={`flex items-center w-full text-left text-sm font-medium transition-colors py-3 px-4 rounded-lg ${activeView === 'available-courses' ? 'text-white bg-orange-500 hover:bg-orange-600' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}
                        >
                            Available Courses
                        </button>
                        <button
                            onClick={() => handleNavClick('my-enrollments')}
                            className={`flex items-center w-full text-left text-sm font-medium transition-colors py-3 px-4 rounded-lg ${activeView === 'my-enrollments' ? 'text-white bg-orange-500 hover:bg-orange-600' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}
                        >
                            My Enrollments
                        </button>
                        <button
                            onClick={() => handleNavClick('course-info')}
                            className={`flex items-center w-full text-left text-sm font-medium transition-colors py-3 px-4 rounded-lg ${activeView === 'course-info' ? 'text-white bg-orange-500 hover:bg-orange-600' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}
                        >
                            Course Info
                        </button>
                    </nav>
                </div>
            </aside>

            <main className="pt-16 lg:ml-60">
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                    <header className="mb-8 sm:mb-10">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                            Student Dashboard
                        </h1>
                        <p className="mt-2 text-gray-500 text-sm sm:text-base">
                            View courses and manage your enrollments
                        </p>
                    </header>

                    {activeView === 'available-courses' && (
                        <section id="available-courses-section">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                                Available Courses
                            </h2>

                            {coursesLoading ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm">Loading courses...</p>
                                </div>
                            ) : coursesError ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-red-500 text-sm">{coursesError}</p>
                                </div>
                            ) : availableCourses.length === 0 ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm">No available courses at the moment.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {availableCourses.map((course) => (
                                        <div
                                            key={course.course_id}
                                            className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-10 bg-orange-400 rounded-full"></div>
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                            {course.course_name}
                                                        </h3>
                                                        {course.faculty_name && (
                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Faculty: {course.faculty_name}
                                                            </p>
                                                        )}
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Created: {new Date(course.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <button
                                                        onClick={() => handleEnroll(course.course_id)}
                                                        disabled={enrollingCourseId === course.course_id || enrollmentStatus[course.course_id]?.type === 'success' || enrollmentStatus[course.course_id]?.type === 'warning'}
                                                        className="px-5 py-2.5 text-xs sm:text-sm font-medium text-orange-500 border border-orange-200 hover:bg-orange-50 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {enrollingCourseId === course.course_id
                                                            ? 'Enrolling...'
                                                            : enrollmentStatus[course.course_id]?.type === 'success' || enrollmentStatus[course.course_id]?.type === 'warning'
                                                                ? 'Requested'
                                                                : 'Enroll'}
                                                    </button>
                                                    {enrollmentStatus[course.course_id]?.message && (
                                                        <p className={`text-xs ${enrollmentStatus[course.course_id]?.type === 'success' ? 'text-green-600' : enrollmentStatus[course.course_id]?.type === 'warning' ? 'text-orange-600' : 'text-red-500'}`}>
                                                            {enrollmentStatus[course.course_id].message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {activeView === 'my-enrollments' && (
                        <section id="my-enrollments-section">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                                My Enrollments
                            </h2>

                            {enrollmentsLoading ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm">Loading enrollments...</p>
                                </div>
                            ) : enrollmentsError ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-red-500 text-sm">{enrollmentsError}</p>
                                </div>
                            ) : myEnrollments.length === 0 ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm">You have not enrolled in any course yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myEnrollments.map((enrollment) => (
                                        <div
                                            key={enrollment.enrollment_id}
                                            className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-10 bg-orange-400 rounded-full"></div>
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                            {enrollment.courseName}
                                                        </h3>
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Enrolled: {new Date(enrollment.enrolled_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-lg capitalize ${getStatusColor(enrollment.status)}`}>
                                                    {enrollment.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {activeView === 'course-info' && (
                        <section id="course-info-section">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                                Course Info
                            </h2>

                            {courseInfoLoading ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm">Loading courses...</p>
                                </div>
                            ) : courseInfoError ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-red-500 text-sm">{courseInfoError}</p>
                                </div>
                            ) : approvedCourses.length === 0 ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm">No course information available.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {approvedCourses.map((course) => (
                                        <div
                                            key={course.course_id}
                                            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleCourseExpand(course.course_id)}
                                                className="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1 h-10 bg-orange-400 rounded-full"></div>
                                                        <div>
                                                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                                {course.course_name}
                                                            </h3>
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                Created: {new Date(course.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-gray-400 text-lg">
                                                        {expandedCourseId === course.course_id ? '▲' : '▼'}
                                                    </span>
                                                </div>
                                            </button>

                                            {expandedCourseId === course.course_id && (
                                                <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-100">
                                                    <h4 className="text-sm font-medium text-gray-700 mt-4 mb-3">
                                                        Approved Students
                                                    </h4>

                                                    {studentsLoading === course.course_id ? (
                                                        <p className="text-gray-500 text-sm">Loading students...</p>
                                                    ) : courseStudents[course.course_id]?.error ? (
                                                        <p className="text-red-500 text-sm">Failed to load students.</p>
                                                    ) : !courseStudents[course.course_id]?.students?.length ? (
                                                        <p className="text-gray-500 text-sm">No approved students yet.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {courseStudents[course.course_id].students.map((student) => (
                                                                <div
                                                                    key={student.id}
                                                                    className="p-3 bg-gray-50 rounded-lg"
                                                                >
                                                                    <p className="text-sm font-medium text-gray-800">
                                                                        {student.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        Enrolled: {new Date(student.enrolledAt).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

export default StudentDashboard;
