import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FacultyDashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [courseName, setCourseName] = useState('');
    const navigate = useNavigate();

    const facultyEmail = 'faculty@example.com';

    const myCourses = [
        { id: 1, name: 'Introduction to Programming', status: 'approved' },
        { id: 2, name: 'Data Structures', status: 'pending' },
        { id: 3, name: 'Database Systems', status: 'rejected' }
    ];

    const enrollmentRequests = [
        { id: 1, studentName: 'John Doe', courseName: 'Data Structures' },
        { id: 2, studentName: 'Jane Smith', courseName: 'Introduction to Programming' },
        { id: 3, studentName: 'Bob Wilson', courseName: 'Database Systems' }
    ];

    const handleLogout = () => {
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

    const handleSubmitCourse = (e) => {
        e.preventDefault();
        alert(`Course "${courseName}" submitted for approval.`);
        setCourseName('');
    };

    const handleApproveEnrollment = (studentName) => {
        alert(`Enrollment approved for ${studentName}.`);
    };

    const handleRejectEnrollment = (studentName) => {
        alert(`Enrollment rejected for ${studentName}.`);
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

                        {myCourses.length === 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">You have no courses yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1 h-10 bg-orange-400 rounded-full"></div>
                                                <div>
                                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                        {course.name}
                                                    </h3>
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
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-lg"
                                >
                                    Submit for Approval
                                </button>
                            </form>
                        </div>
                    </section>

                    <section id="enrollments-section">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">
                            Enrollment Approvals
                        </h2>

                        {enrollmentRequests.length === 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-sm">No enrollment requests at the moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {enrollmentRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-10 bg-orange-400 rounded-full"></div>
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                            {request.studentName}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            Course: {request.courseName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 shrink-0">
                                                <button
                                                    onClick={() => handleApproveEnrollment(request.studentName)}
                                                    className="px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-lg"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectEnrollment(request.studentName)}
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
                </div>
            </main>
        </div>
    );
}

export default FacultyDashboard;
