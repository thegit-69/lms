import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import supabase from '../services/supabaseClient';

function ProtectedRoute({ children, allowedRoles }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Get current session
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setLoading(false);
                    return;
                }

                setUser(session.user);

                // Fetch user role from profiles
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (!error && profile) {
                    setRole(profile.role);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setUser(null);
                setRole(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role not allowed - redirect to login
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
