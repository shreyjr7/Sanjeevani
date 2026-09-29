import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
  }, []);

  const login = async (email, password, role) => {
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://127.0.0.1:8000';
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.access_token;
        localStorage.setItem('token', token);

        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (meRes.ok) {
          const userData = await meRes.json();
          const realUser = {
            id: userData.id,
            name: userData.full_name,
            email: userData.email,
            role: userData.role,
            age: userData.age,
            gender: userData.gender,
            phone: userData.phone,
            emergency_contact: userData.emergency_contact,
            bio: userData.bio,
            created_at: userData.created_at
          };
          localStorage.setItem('user', JSON.stringify(realUser));
          setUser(realUser);
          setIsAuthenticated(true);
          return realUser;
        }
      }
    } catch (e) {
      console.log('Backend auth unavailable, using demo mode:', e.message);
    }

    // Fallback to demo credentials
    const isVictim = role === 'victim' || email.includes('victim');
    const mockUser = {
      id: isVictim ? 2 : 1,
      name: isVictim ? 'Elena Vance' : 'Dr. Sarah Jenkins',
      email,
      role: isVictim ? 'victim' : 'counsellor',
      age: isVictim ? 29 : 38,
      gender: 'Female',
      phone: isVictim ? '+1 (555) 782-4419' : '+1 (555) 234-8901',
      emergency_contact: isVictim ? 'Marcus Vance (Brother) - +1 (555) 782-9900' : 'Dr. Robert Davis - +1 (555) 902-1100',
      bio: isVictim ? 'High-stress trauma survivor currently monitored for PTSD and acute panic symptoms.' : 'Licensed Clinical Psychologist specializing in acute trauma triage and crisis stabilization.'
    };
    const mockToken = 'mock-jwt-token-12345';
    
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', mockToken);
    
    setUser(mockUser);
    setIsAuthenticated(true);
    return mockUser;
  };

  const register = async (registerData) => {
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://127.0.0.1:8000';
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          role: registerData.role,
          full_name: registerData.full_name,
          age: registerData.age ? parseInt(registerData.age) : null,
          gender: registerData.gender || null,
          phone: registerData.phone || null,
          emergency_contact: registerData.emergency_contact || null,
          bio: registerData.bio || null
        })
      });

      if (res.ok) {
        // Automatically log in after registration
        return await login(registerData.email, registerData.password, registerData.role);
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Registration failed');
      }
    } catch (e) {
      console.log('Registration error:', e.message);
      // If backend fails, create fallback user
      const fallbackUser = {
        id: Date.now(),
        name: registerData.full_name,
        email: registerData.email,
        role: registerData.role,
        age: registerData.age,
        gender: registerData.gender,
        phone: registerData.phone,
        emergency_contact: registerData.emergency_contact,
        bio: registerData.bio
      };
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      localStorage.setItem('token', 'mock-jwt-token-reg');
      setUser(fallbackUser);
      setIsAuthenticated(true);
      return fallbackUser;
    }
  };

  const updateUser = async (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    const token = localStorage.getItem('token');
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://127.0.0.1:8000';
    
    if (token && token !== 'mock-jwt-token-12345') {
      try {
        await fetch(`${API_URL}/api/auth/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            full_name: updatedFields.name || updatedFields.full_name,
            age: updatedFields.age ? parseInt(updatedFields.age) : undefined,
            gender: updatedFields.gender,
            phone: updatedFields.phone,
            emergency_contact: updatedFields.emergency_contact,
            bio: updatedFields.bio
          })
        });
      } catch (err) {
        console.warn('Could not sync profile to backend:', err.message);
      }
    }
    return updatedUser;
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
