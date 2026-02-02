import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabaseClient';

function FacultyDashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [courseName, setCourseName] = useState('');
    const [myCourses, setMyCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [facultyEmail, setFacultyEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formFeedback, setFormFeedback] = useState({ type: '', message: '' });
    const [pendingEnrollments, setPendingEnrollments] = useState([]);
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
    const [enrollmentsError, setEnrollmentsError] = useState(null);
    const [enrollmentFeedback, setEnrollmentFeedback] = useState({ type: '', message: '' });
    const [currentUserId, setCurrentUserId] = useState(null);
    const [approvedCourses, setApprovedCourses] = useState([]);
    const [approvedCoursesLoading, setApprovedCoursesLoading] = useState(true);
    const [approvedCoursesError, setApprovedCoursesError] = useState(null);
    const [expandedCourseId, setExpandedCourseId] = useState(null);
    const [courseStudents, setCourseStudents] = useState({});
    const [studentsLoading, setStudentsLoading] = useState({});
    const navigate = useNavigate();

    const fetchMyCourses = async (userId) => {
        const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('course_id, course_name, faculty_id, created_at, status')
            .eq('faculty_id', userId)
            .order('created_at', { ascending: false });

        if (coursesError) {
            console.error('Courses error:', coursesError);
            setError('Failed to load courses. Please try again.');
        } else {
            setMyCourses(coursesData || []);
        }
    };

    const fetchPendingEnrollments = async (userId) => {
        setEnrollmentsLoading(true);
        setEnrollmentsError(null);

        try {
            // First, get faculty's courses
            const { data: facultyCourses, error: coursesError } = await supabase
                .from('courses')
                .select('course_id, course_name')
                .eq('faculty_id', userId);

            if (coursesError) {
                console.error('Enrollments error:', coursesError);
                setEnrollmentsError('Failed to load enrollments.');
                setEnrollmentsLoading(false);
                return;
            }

            if (!facultyCourses || facultyCourses.length === 0) {
                setPendingEnrollments([]);
                setEnrollmentsLoading(false);
                return;
            }

            const courseIds = facultyCourses.map(c => c.course_id);
            const courseMap = facultyCourses.reduce((acc, c) => {
                acc[c.course_id] = c.course_name;
                return acc;
            }, {});

            // Fetch pending enrollments for these courses
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select('enrollment_id, course_id, student_id, status, enrolled_at')
                .eq('status', 'pending')
                .in('course_id', courseIds)
                .order('enrolled_at', { ascending: false });

            if (enrollmentsError) {
                console.error('Enrollments error:', enrollmentsError);
                setEnrollmentsError('Failed to load enrollments.');
                setEnrollmentsLoading(false);
                return;
            }

            if (!enrollmentsData || enrollmentsData.length === 0) {
                setPendingEnrollments([]);
                setEnrollmentsLoading(false);
                return;
            }

            // Fetch student profiles
            const studentIds = [...new Set(enrollmentsData.map(e => e.student_id).filter(Boolean))];
            let studentsMap = {};

            if (studentIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, username')
                    .in('id', studentIds);

                if (profilesError) {
                    console.error('Enrollments error:', profilesError);
                } else {
                    studentsMap = (profilesData || []).reduce((acc, p) => {
                        acc[p.id] = p.username;
                        return acc;
                    }, {});
                }
            }

            // Merge data
            const enrichedEnrollments = enrollmentsData.map(enrollment => ({
                ...enrollment,
                course_name: courseMap[enrollment.course_id] || 'Unknown Course',
                student_name: studentsMap[enrollment.student_id] || 'Unknown Student'
            }));

            setPendingEnrollments(enrichedEnrollments);
        } catch (err) {
            console.error('Enrollments error:', err);
            setEnrollmentsError('An unexpected error occurred.');
        }

        setEnrollmentsLoading(false);
    };

    const fetchApprovedCourses = async (userId) => {
        setApprovedCoursesLoading(true);
        setApprovedCoursesError(null);

        try {
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('course_id, course_name, created_at, status')
                .eq('faculty_id', userId)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (coursesError) {
                console.error('Approved courses error:', coursesError);
                setApprovedCoursesError('Failed to load approved courses.');
            } else {
                setApprovedCourses(coursesData || []);
            }
        } catch (err) {
            console.error('Approved courses error:', err);
            setApprovedCoursesError('An unexpected error occurred.');
        }

        setApprovedCoursesLoading(false);
    };

    const fetchCourseStudents = async (courseId) => {
        setStudentsLoading(prev => ({ ...prev, [courseId]: true }));

        try {
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select('enrollment_id, student_id, enrolled_at')
                .eq('course_id', courseId)
                .eq('status', 'approved')
                .order('enrolled_at', { ascending: false });

            if (enrollmentsError) {
                console.error('Enrollments error:', enrollmentsError);
                setCourseStudents(prev => ({ ...prev, [courseId]: { error: true, students: [] } }));
                setStudentsLoading(prev => ({ ...prev, [courseId]: false }));
                return;
            }

            if (!enrollmentsData || enrollmentsData.length === 0) {
                setCourseStudents(prev => ({ ...prev, [courseId]: { error: false, students: [] } }));
                setStudentsLoading(prev => ({ ...prev, [courseId]: false }));
                return;
            }

            const studentIds = [...new Set(enrollmentsData.map(e => e.student_id).filter(Boolean))];
            let studentsMap = {};

            if (studentIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, username')
                    .in('id', studentIds);

                if (profilesError) {
                    console.error('Enrollments error:', profilesError);
                } else {
                    studentsMap = (profilesData || []).reduce((acc, p) => {
                        acc[p.id] = p.username;
                        return acc;
                    }, {});
                }
            }

            const enrichedStudents = enrollmentsData.map(enrollment => ({
                ...enrollment,
                student_name: studentsMap[enrollment.student_id] || 'Unknown Student'
            }));

            setCourseStudents(prev => ({ ...prev, [courseId]: { error: false, students: enrichedStudents } }));
        } catch (err) {
            console.error('Enrollments error:', err);
            setCourseStudents(prev => ({ ...prev, [courseId]: { error: true, students: [] } }));
        }

        setStudentsLoading(prev => ({ ...prev, [courseId]: false }));
    };

    const toggleCourseExpand = (courseId) => {
        if (expandedCourseId === courseId) {
            setExpandedCourseId(null);
        } else {
            setExpandedCourseId(courseId);
            if (!courseStudents[courseId]) {
                fetchCourseStudents(courseId);
            }
        }
    };

    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setError('Not authenticated');
                    setLoading(false);
                    return;
                }

                setFacultyEmail(user.email || '');
                setCurrentUserId(user.id);
                await fetchMyCourses(user.id);
                await fetchPendingEnrollments(user.id);
                await fetchApprovedCourses(user.id);
            } catch (err) {
                console.error('Unexpected error:', err);
                setError('An unexpected error occurred.');
            }

            setLoading(false);
        };

        initDashboard();
    }, []);

    const handleUpdateEnrollment = async (enrollmentId, newStatus) => {
        setEnrollmentFeedback({ type: '', message: '' });

        const { error: updateError } = await supabase
            .from('enrollments')
            .update({ status: newStatus })
            .eq('enrollment_id', enrollmentId);

        if (updateError) {
            console.error('Update error:', updateError);
            setEnrollmentFeedback({ type: 'error', message: `Failed to ${newStatus} enrollment.` });
        } else {
            setEnrollmentFeedback({ type: 'success', message: `Enrollment ${newStatus}.` });
            if (currentUserId) {
                await fetchPendingEnrollments(currentUserId);
            }
        }

        setTimeout(() => setEnrollmentFeedback({ type: '', message: '' }), 3000);
    };

    const handleApproveEnrollment = (enrollmentId) => {
        handleUpdateEnrollment(enrollmentId, 'approved');
    };

    const handleRejectEnrollment = (enrollmentId) => {
        handleUpdateEnrollment(enrollmentId, 'rejected');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleNavClick = (section) => {
        setDrawerOpen(false);
        const element = document.getElementById(section);
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    const handleSubmitCourse = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormFeedback({ type: '', message: '' });

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setFormFeedback({ type: 'error', message: 'Not authenticated.' });
                setSubmitting(false);
                return;
            }

            const { error: insertError } = await supabase
                .from('courses')
                .insert({
                    course_name: courseName,
                    faculty_id: user.id,
                    status: 'pending'
                });

            if (insertError) {
                console.error('Create course error:', insertError);
                setFormFeedback({ type: 'error', message: 'Failed to submit course.' });
            } else {
                setFormFeedback({ type: 'success', message: 'Course submitted for approval.' });
                setCourseName('');
                await fetchMyCourses(user.id);
            }
        } catch (err) {
            console.error('Create course error:', err);
            setFormFeedback({ type: 'error', message: 'Failed to submit course.' });
        }

        setSubmitting(false);
        setTimeout(() => setFormFeedback({ type: '', message: '' }), 3000);
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
                            <span className="text-xl font-bold text-gray-800">LMS Faculty</span>
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600 hidden sm:block truncate max-w-48">
                            {facultyEmail}
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
                            onClick={() => handleNavClick('my-courses-section')}
                            className="flex items-center w-full text-left text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors py-3 px-4 rounded-lg"
                        >
                            My Courses
                        </button>
                        <button
                            onClick={() => handleNavClick('create-course-section')}
                            className="flex items-center w-full text-left text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors py-3 px-4 rounded-lg"
                        >
                            Create Course
                        </button>
                        <button
                            onClick={() => handleNavClick('enrollments-section')}
                            className="flex items-center w-full text-left text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors py-3 px-4 rounded-lg"
                        >
                            Enrollments to Approve
                        </button>
                        <button
                            onClick={() => handleNavClick('course-info-section')}
                            className="flex items-center w-full text-left text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors py-3 px-4 rounded-lg"
                        >
                            Course Info
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full text-left text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors py-3 px-4 rounded-lg"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </aside>

            <main className="pt-16 lg:ml-60">
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                    <header className="mb-8 sm:mb-10">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                            Faculty Dashboard
                        </h1>
                        <p className="mt-2 text-gray-500 text-sm sm:text-base">
                            Manage your courses and student enrollments
                        </p>
                    </header>

                    <section id="my-courses-section" className="mb-10 sm:mb-12">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                            My Courses
                        </h2>

                        {loading ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">Loading courses...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        ) : myCourses.length === 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">You have not created any courses yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myCourses.map((course) => (
                                    <div
                                        key={course.course_id}
                                        className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                                            <span className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-lg capitalize ${getStatusColor(course.status)}`}>
                                                {course.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section id="create-course-section" className="mb-10 sm:mb-12">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                            Create New Course
                        </h2>

                        <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100">
                            {formFeedback.message && (
                                <div className={`mb-4 p-3 text-sm rounded-lg ${formFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {formFeedback.message}
                                </div>
                            )}
                            <form onSubmit={handleSubmitCourse} className="space-y-4">
                                <div>
                                    <label htmlFor="courseName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Course Name
                                    </label>
                                    <input
                                        type="text"
                                        id="courseName"
                                        value={courseName}
                                        onChange={(e) => setCourseName(e.target.value)}
                                        placeholder="Enter course name"
                                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Submit for Approval'}
                                </button>
                            </form>
                        </div>
                    </section>

                    <section id="enrollments-section">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                            Enrollment Approvals
                        </h2>

                        {enrollmentFeedback.message && (
                            <div className={`mb-4 p-3 text-sm rounded-lg ${enrollmentFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {enrollmentFeedback.message}
                            </div>
                        )}

                        {enrollmentsLoading ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">Loading enrollments...</p>
                            </div>
                        ) : enrollmentsError ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-red-500 text-sm">{enrollmentsError}</p>
                            </div>
                        ) : pendingEnrollments.length === 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">No pending enrollments.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingEnrollments.map((enrollment) => (
                                    <div
                                        key={enrollment.enrollment_id}
                                        className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-10 bg-orange-400 rounded-full"></div>
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                            {enrollment.student_name}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            Course: {enrollment.course_name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Enrolled: {new Date(enrollment.enrolled_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 shrink-0">
                                                <button
                                                    onClick={() => handleApproveEnrollment(enrollment.enrollment_id)}
                                                    className="px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-lg"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectEnrollment(enrollment.enrollment_id)}
                                                    className="px-5 py-2.5 text-xs sm:text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section id="course-info-section">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                            Course Info
                        </h2>

                        {approvedCoursesLoading ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">Loading approved courses...</p>
                            </div>
                        ) : approvedCoursesError ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-red-500 text-sm">{approvedCoursesError}</p>
                            </div>
                        ) : approvedCourses.length === 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">No approved courses yet.</p>
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
                                                    <div className="w-1 h-10 bg-green-400 rounded-full"></div>
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
                                                    Enrolled Students
                                                </h4>

                                                {studentsLoading[course.course_id] ? (
                                                    <p className="text-gray-500 text-sm">Loading students...</p>
                                                ) : courseStudents[course.course_id]?.error ? (
                                                    <p className="text-red-500 text-sm">Failed to load students.</p>
                                                ) : courseStudents[course.course_id]?.students?.length === 0 ? (
                                                    <p className="text-gray-500 text-sm">No approved students yet.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {courseStudents[course.course_id]?.students?.map((student) => (
                                                            <div
                                                                key={student.enrollment_id}
                                                                className="p-3 bg-gray-50 rounded-lg"
                                                            >
                                                                <p className="text-sm font-medium text-gray-800">
                                                                    {student.student_name}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    Enrolled: {new Date(student.enrolled_at).toLocaleString()}
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
                </div>
            </main>
        </div>
    );
}

export default FacultyDashboard;
