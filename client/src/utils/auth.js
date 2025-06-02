export const getAuthToken = () => localStorage.getItem('adminToken');
export const getAdminUser = () => {
    const user = localStorage.getItem('adminUser');
    try {
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error("Error parsing adminUser from localStorage", error);
        localStorage.removeItem('adminUser'); // Clear corrupted data
        return null;
    }
};