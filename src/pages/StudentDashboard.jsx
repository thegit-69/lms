import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeView, setActiveView] = useState('available-courses');
    const [expandedCourseId, setExpandedCourseId] = useState(null);
    const navigate = useNavigate();

    const studentEmail = 'student@example.com';

    const availableCourses = [
        { id: 1, name: 'Data Structures', faculty: 'Prof. Rahul', status: 'approved' },
        { id: 2, name: 'Operating Systems', faculty: 'Prof. Sharma', status: 'approved' },
        { id: 3, name: 'Database Management', faculty: 'Prof. Kumar', status: 'approved' }
    ];

    const myEnrollments = [
        { id: 1, courseName: 'Introduction to Programming', status: 'approved', enrolledAt: '2026-01-15T10:30:00' },
        { id: 2, courseName: 'Web Development', status: 'pending', enrolledAt: '2026-01-28T14:00:00' },
        { id: 3, courseName: 'Machine Learning', status: 'rejected', enrolledAt: '2026-01-20T09:00:00' }
    ];

    const courseInfoData = [
        {
            id: 1,
            name: 'Introduction to Programming',
            createdAt: '2025-12-01T08:00:00',
            students: [
                { id: 1, name: 'John Doe', enrolledAt: '2026-01-10T10:00:00' },
                { id: 2, name: 'Jane Smith', enrolledAt: '2026-01-12T11:30:00' }
            ]
        },
        {
            id: 2,
            name: 'Web Development',
            createdAt: '2025-12-15T09:00:00',
            students: [
                { id: 3, name: 'Bob Wilson', enrolledAt: '2026-01-18T14:00:00' }
            ]
        }
    ];

    const handleLogout = () => {
        navigate('/login');
    };

    const handleNavClick = (view) => {
        setDrawerOpen(false);
        setActiveView(view);
    };

    const handleEnroll = (courseName) => {
        alert(`Enrollment request sent for "${courseName}".`);
    };

    const toggleCourseExpand = (courseId) => {
        if (expandedCourseId === courseId) {
            setExpandedCourseId(null);
        } else {
            setExpandedCourseId(courseId);
        }
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

                            {availableCourses.length === 0 ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm">No courses available at the moment.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {availableCourses.map((course) => (
                                        <div
                                            key={course.id}
                                            className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-10 bg-orange-400 rounded-full"></div>
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                            {course.name}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            Faculty: {course.faculty}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleEnroll(course.name)}
                                                    className="px-5 py-2.5 text-xs sm:text-sm font-medium text-orange-500 border border-orange-200 hover:bg-orange-50 transition-colors rounded-lg"
                                                >
                                                    Enroll
                                                </button>
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

                            {myEnrollments.length === 0 ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm">You have not enrolled in any courses yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myEnrollments.map((enrollment) => (
                                        <div
                                            key={enrollment.id}
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
                                                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleString()}
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

                            {courseInfoData.length === 0 ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm">No course information available.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {courseInfoData.map((course) => (
                                        <div
                                            key={course.id}
                                            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleCourseExpand(course.id)}
                                                className="w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1 h-10 bg-green-400 rounded-full"></div>
                                                        <div>
                                                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                                {course.name}
                                                            </h3>
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                Created: {new Date(course.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-gray-400 text-lg">
                                                        {expandedCourseId === course.id ? '▲' : '▼'}
                                                    </span>
                                                </div>
                                            </button>

                                            {expandedCourseId === course.id && (
                                                <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-100">
                                                    <h4 className="text-sm font-medium text-gray-700 mt-4 mb-3">
                                                        Enrolled Students
                                                    </h4>

                                                    {course.students.length === 0 ? (
                                                        <p className="text-gray-500 text-sm">No students enrolled yet.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {course.students.map((student) => (
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
