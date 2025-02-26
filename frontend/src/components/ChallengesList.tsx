import { useEffect, useState } from 'react';
import { API } from '../services/api';
import { useAuth } from '@clerk/clerk-react';

export function ChallengesList() {
    const { getToken } = useAuth()

    const [challenges, setChallenges] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [retryCount, setRetryCount] = useState(0); // Add this to control retries

    useEffect(() => {
        let isMounted = true;

        const loadChallenges = async () => {
            const token = await getToken()

            try {
                setError(null);
                setLoading(true);

                const data = await API.challenges.list(token);

                if (isMounted) {
                    setChallenges(data.challenges);
                }
            } catch (err) {
                console.error('Failed to fetch challenges:', err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Unknown error occurred');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadChallenges();

        return () => {
            isMounted = false;
        };
    }, [retryCount]); // Replace error with retryCount in dependencies

    // Update retry handler to increment count instead of directly setting error
    const handleRetry = () => setRetryCount(count => count + 1);

    if (loading) {
        return <div>Loading challenges...</div>;
    }

    if (error) {
        return (
            <div>
                <h2>Error loading challenges</h2>
                <p>{error}</p>
                <button onClick={handleRetry}>Retry</button>
            </div>
        );
    }

    return (
        <div>
            <h2>Challenges</h2>
            <ul>
                {Object.entries(challenges).map(([key, value]) => (
                    <li key={key}>{value}</li>
                ))}
            </ul>
        </div>
    );
}