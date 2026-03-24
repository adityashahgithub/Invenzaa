import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { userApi } from '../api/userApi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { User, Shield, Save, Key } from "lucide-react";

export const Profile = () => {
    const { user, refreshUser } = useAuth();
    const { showToast } = useUI();
    const [profileForm, setProfileForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsProfileLoading(true);
        try {
            await userApi.updateMe(profileForm);
            await refreshUser();
            showToast('Profile updated successfully', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return showToast('Passwords do not match', 'error');
        }
        setIsPasswordLoading(true);
        try {
            await userApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            showToast('Password changed successfully', 'success');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        <div className="page-container">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-slate-400">Manage your profile information and security preferences.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-indigo-400" /> Personal Information
                        </CardTitle>
                        <CardDescription className="text-slate-500">Update your basic account details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        className="bg-slate-950 border-slate-800 focus:border-indigo-500"
                                        value={profileForm.firstName}
                                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        className="bg-slate-950 border-slate-800 focus:border-indigo-500"
                                        value={profileForm.lastName}
                                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="bg-slate-950/50 border-slate-800 text-slate-500 cursor-not-allowed"
                                    value={user?.email || ''}
                                    disabled
                                />
                                <p className="text-[10px] text-slate-600 italic">Contact administrator to change your registered email.</p>
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isProfileLoading}>
                                {isProfileLoading ? (
                                    'Saving Changes...'
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Save Profile
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-rose-400" /> Security
                        </CardTitle>
                        <CardDescription className="text-slate-500">Ensure your account is protected with a strong password.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    className="bg-slate-950 border-slate-800 focus:border-rose-500/50"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    className="bg-slate-950 border-slate-800 focus:border-rose-500/50"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    minLength={8}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    className="bg-slate-950 border-slate-800 focus:border-rose-500/50"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    minLength={8}
                                    required
                                />
                            </div>
                            <Button type="submit" variant="destructive" className="w-full bg-rose-600 hover:bg-rose-700" disabled={isPasswordLoading}>
                                {isPasswordLoading ? (
                                    'Updating Password...'
                                ) : (
                                    <>
                                        <Key className="mr-2 h-4 w-4" /> Update Password
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
