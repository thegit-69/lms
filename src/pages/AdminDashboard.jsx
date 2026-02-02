import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabaseClient';

function AdminDashboard() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionFeedback, setActionFeedback] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const pendingRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setAdminEmail(user.email || '');
                }

                // STEP A: Fetch courses
                const { data: coursesData, error: coursesError } = await supabase
                    .from('courses')
                    .select('course_id, course_name, faculty_id, status, created_at')
                    .order('created_at', { ascending: false });

                if (coursesError) {
                    console.error('Courses error:', coursesError);
                    setError('Failed to load courses. Please try again.');
                    setLoading(false);
                    return;
                }

                console.log('Courses:', coursesData);

                // STEP B: Fetch faculty names
                const facultyIds = (coursesData || []).map(c => c.faculty_id).filter(Boolean);
                let profilesMap = {};

                if (facultyIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, username')
                        .in('id', facultyIds);

                    if (profilesError) {
                        console.error('Profiles error:', profilesError);
                    } else {
                        console.log('Profiles:', profilesData);
                        (profilesData || []).forEach(profile => {
                            profilesMap[profile.id] = profile.username;
                        });
                    }
                }

                // STEP C: Merge data
                const coursesWithFaculty = (coursesData || []).map(course => {
                    const matchedUsername = profilesMap[course.faculty_id];
                    return {
                        ...course,
                        faculty_name: matchedUsername ? matchedUsername : 'Unknown Faculty'
                    };
                });

                setCourses(coursesWithFaculty);
            } catch (err) {
                console.error('Unexpected error:', err);
                setError('An unexpected error occurred.');
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const updateCourseStatus = async (courseId, newStatus) => {
        setActionFeedback('');
        const { error } = await supabase
            .from('courses')
            .update({ status: newStatus })
            .eq('course_id', courseId);

        if (error) {
            setActionFeedback(`Failed to ${newStatus} course. Please try again.`);
        } else {
            setActionFeedback(`Course ${newStatus} successfully.`);
            setCourses((prev) =>
                prev.map((course) =>
                    course.course_id === courseId
                        ? { ...course, status: newStatus }
                        : course
                )
            );
        }

        setTimeout(() => setActionFeedback(''), 3000);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const scrollToPending = () => {
        setDrawerOpen(false);
        setTimeout(() => {
            pendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleCreateUser = () => {
        setDrawerOpen(false);
        alert('Create new user functionality coming soon.');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getFacultyName = (course) => {
        return course.faculty_name || 'Unknown Faculty';
    };

    const pendingCourses = courses.filter((c) => c.status === 'pending');
    const approvedCourses = courses.filter((c) => c.status === 'approved');

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-gray-500 text-base">Loading courses...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-base mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

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
                            <span className="text-xl font-bold text-gray-800">LMS</span>
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600 hidden sm:block truncate max-w-48">
                            {adminEmail}
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
                className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-60 bg-white border-r border-gray-100 z-40 transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0`}
            >
                <div className="p-5 pt-6">
                    <nav className="space-y-1">
                        <button
                            onClick={scrollToPending}
                            className="flex items-center w-full text-left text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors py-3 px-4 rounded-lg"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={handleCreateUser}
                            className="flex items-center w-full text-left text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors py-3 px-4 rounded-lg"
                        >
                            Create new user
                        </button>
                    </nav>
                </div>
            </aside>

            <main className="pt-16 lg:ml-60">
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                    <header className="mb-8 sm:mb-10">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                            Admin Dashboard
                        </h1>
                        <p className="mt-2 text-gray-500 text-sm sm:text-base">
                            Review and manage course submissions
                        </p>
                    </header>

                    {actionFeedback && (
                        <div className="mb-6 p-4 bg-orange-50 text-orange-700 text-sm rounded-lg border border-orange-100">
                            {actionFeedback}
                        </div>
                    )}

                    <section ref={pendingRef} id="pending-section" className="mb-10 sm:mb-12">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                            Pending Approval
                        </h2>

                        {pendingCourses.length === 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">No pending courses at the moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingCourses.map((course) => (
                                    <div
                                        key={course.course_id}
                                        className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-10 bg-orange-400 rounded-full"></div>
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                            {course.course_name}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            Faculty: {getFacultyName(course)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 ml-4 text-xs text-gray-400">
                                                    Created: {formatDate(course.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex gap-3 shrink-0">
                                                <button
                                                    onClick={() => updateCourseStatus(course.course_id, 'approved')}
                                                    className="px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-lg"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => updateCourseStatus(course.course_id, 'rejected')}
                                                    className="px-5 py-2.5 text-xs sm:text-sm font-medium text-orange-500 border border-orange-200 hover:bg-orange-50 transition-colors rounded-lg"
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

                    <section>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                            Approved Courses
                        </h2>

                        {approvedCourses.length === 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">No approved courses yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {approvedCourses.map((course) => (
                                    <div
                                        key={course.course_id}
                                        className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-10 bg-green-400 rounded-full"></div>
                                            <div>
                                                <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                    {course.course_name}
                                                </h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Faculty: {getFacultyName(course)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 ml-4 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs text-gray-400">
                                            <p>Created: {formatDate(course.created_at)}</p>
                                        </div>
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

export default AdminDashboard;
