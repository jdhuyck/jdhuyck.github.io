import React, { useState } from 'react'
import { initiateGitHubAuth, login } from '../../lib/authUtils';

const Login: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handlePasswordLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(password)) {
            window.location.href = "/admin";
        } else {
            setError('Invalid password');
        }
    };

    return (
        <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
                    Admin Login
                </h2>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
                    {/* GitHub OAuth Button */}
                    <div className='mb-6'>
                        <button
                            onClick={initiateGitHubAuth}
                            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                        >
                            Sign in with GitHub
                        </button>
                    </div>

                    <div className='relative mb-6'>
                        <div className='absolute inset-0 flex items-center' />
                        <div className='w-full border-t border-gray-300' />
                    </div>
                    <div className='relative flex justify-center text-sm'>
                        <span className='px-2 bg-white text-gray-500'>Or</span>
                    </div>
                </div>

                {/* Password Fallback */}
                <form className='space-y-6' onSubmit={handlePasswordLogin}>
                    <div>
                        <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                            Admin Password
                        </label>
                        <div className='mt-1'>
                            <input
                                id='password'
                                name='password'
                                type='password'
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md  placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                placeholder='Enter admin password'
                            />
                        </div>
                    </div>

                    {error && (
                        <div className='text-sm text-red-600'>{error}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;