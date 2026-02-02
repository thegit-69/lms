import { useState, useEffect } from 'react';
import supabase from '../services/supabaseClient';

function AdminDashboard() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFeedback, setActionFeedback] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching courses:', error);
            } else {
                setCourses(data || []);
            }
            setLoading(false);
        };

        fetchCourses();
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

    const pendingCourses = courses.filter((c) => c.status === 'pending');
    const approvedCourses = courses.filter((c) => c.status === 'approved');

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-500 text-lg">Loading courses...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
                <header className="mb-12 sm:mb-16">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-black tracking-tight">
                        Admin Dashboard
                    </h1>
                    <p className="mt-3 text-gray-500 text-base sm:text-lg">
                        Review and manage course submissions
                    </p>
                </header>

                {actionFeedback && (
                    <p className="mb-8 text-sm text-gray-600">{actionFeedback}</p>
                )}

                <section className="mb-16 sm:mb-20">
                    <h2 className="text-xl sm:text-2xl font-medium text-black mb-6 sm:mb-8">
                        Pending Approval
                    </h2>

                    {pendingCourses.length === 0 ? (
                        <p className="text-gray-400 text-base">No pending courses at the moment.</p>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            {pendingCourses.map((course) => (
                                <div
                                    key={course.course_id}
                                    className="py-5 sm:py-6 border-b border-gray-100"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg sm:text-xl font-normal text-black">
                                                {course.course_name}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-400">
                                                Faculty: {course.faculty_id || 'Not assigned'}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-300 uppercase tracking-wide">
                                                {course.status}
                                            </p>
                                        </div>
                                        <div className="flex gap-3 sm:gap-4">
                                            <button
                                                onClick={() => updateCourseStatus(course.course_id, 'approved')}
                                                className="px-4 py-2 text-sm font-medium text-black border border-black hover:bg-black hover:text-white transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => updateCourseStatus(course.course_id, 'rejected')}
                                                className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-200 hover:border-gray-400 hover:text-gray-600 transition-colors"
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
                    <h2 className="text-xl sm:text-2xl font-medium text-black mb-6 sm:mb-8">
                        Approved Courses
                    </h2>

                    {approvedCourses.length === 0 ? (
                        <p className="text-gray-400 text-base">No approved courses yet.</p>
                    ) : (
                        <div className="space-y-4 sm:space-y-5">
                            {approvedCourses.map((course) => (
                                <div
                                    key={course.course_id}
                                    className="py-4 sm:py-5 border-b border-gray-50"
                                >
                                    <h3 className="text-base sm:text-lg font-normal text-black">
                                        {course.course_name}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-400">
                                        Faculty: {course.faculty_id || 'Not assigned'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default AdminDashboard;
