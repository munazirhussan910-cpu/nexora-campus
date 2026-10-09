'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/ui/Avatar';
import { ImageCropModal } from '@/components/modals/ImageCropModal';
import { RemovePhotoConfirmModal } from '@/components/modals/RemovePhotoConfirmModal';
import {
  User,
  Mail,
  Phone,
  Building,
  Award,
  Shield,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Lock,
  Home,
  Briefcase,
  FileText,
  Sparkles,
  Upload,
  Camera,
  Trash2,
} from 'lucide-react';

interface ProfileViewAndEditorProps {
  portalTitle?: string;
  portalSubtitle?: string;
  roleBadgeColor?: string;
}

export function ProfileViewAndEditor({
  portalTitle = 'User Profile',
  portalSubtitle = 'Official campus identity, departmental records, and communication credentials.',
  roleBadgeColor = 'from-primary to-amber-600',
}: ProfileViewAndEditorProps) {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals for Photo Management
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    parentPhone: '',
    department: '',
    designation: '',
    specialization: '',
    bio: '',
    profilePhotoUrl: null as string | null,
  });

  const isStudent = user?.role === 'STUDENT';

  // Initialize or reset form data when user changes or edit mode toggles
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.username || '',
        phone: user.phone || '',
        parentPhone: user.parentPhone || '',
        department: user.department || (user.branch ? `Department of ${user.branch}` : ''),
        designation: user.designation || (isStudent ? 'Student' : ''),
        specialization: user.specialization || '',
        bio: user.bio || '',
        profilePhotoUrl: user.profilePhotoUrl || null,
      });
    }
  }, [user, isEditing, isStudent]);

  const handleEditClick = () => {
    setSuccessMsg('');
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setErrorMsg('');
    if (user) {
      setFormData({
        fullName: user.fullName || user.username || '',
        phone: user.phone || '',
        parentPhone: user.parentPhone || '',
        department: user.department || (user.branch ? `Department of ${user.branch}` : ''),
        designation: user.designation || (isStudent ? 'Student' : ''),
        specialization: user.specialization || '',
        bio: user.bio || '',
        profilePhotoUrl: user.profilePhotoUrl || null,
      });
    }
  };

  // Handle client-side file selection and validation
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so selecting the same file again triggers change event
    e.target.value = '';

    // 1. File Type Validation
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setErrorMsg('Image must be JPG, PNG, or WEBP.');
      return;
    }

    // 2. File Size Validation (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg('Image size must be less than 5 MB.');
      return;
    }

    // Read and open crop modal
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setRawImageSrc(result);
        setCropModalOpen(true);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Unable to read selected image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Called when user applies square crop in ImageCropModal
  const handleCropComplete = (croppedDataUrl: string) => {
    setFormData((prev) => ({ ...prev, profilePhotoUrl: croppedDataUrl }));
    setSuccessMsg('Profile photo preview ready. Click "Save Changes" to apply.');
  };

  // Confirmed removal of profile photo
  const handleConfirmRemovePhoto = async () => {
    setRemovingPhoto(true);
    setFormData((prev) => ({ ...prev, profilePhotoUrl: null }));
    setRemoveModalOpen(false);
    setRemovingPhoto(false);
    setSuccessMsg('Profile photo removed. Click "Save Changes" to finalize.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = formData.fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }

    if (formData.bio && formData.bio.length > 1000) {
      setErrorMsg('Bio cannot exceed 1000 characters.');
      return;
    }

    setSubmitting(true);

    const payload: any = {
      fullName: trimmedName,
      phone: formData.phone.trim() || null,
      department: formData.department.trim() || null,
      bio: formData.bio.trim() || null,
      profilePhotoUrl: formData.profilePhotoUrl,
    };

    if (isStudent) {
      payload.parentPhone = formData.parentPhone.trim() || null;
    } else {
      payload.designation = formData.designation.trim() || null;
      payload.specialization = formData.specialization.trim() || null;
    }

    const result = await updateProfile(payload);

    if (result.success) {
      setSuccessMsg('Profile updated successfully.');
      setIsEditing(false);
    } else {
      setErrorMsg(result.error || 'Failed to update profile.');
    }
    setSubmitting(false);
  };

  const academicStanding =
    user?.year === 1
      ? '1st Year (Semester 2)'
      : user?.year === 2
      ? '2nd Year (Semester 4)'
      : user?.year === 3
      ? '3rd Year (Semester 6)'
      : user?.year === 4
      ? '4th Year (Semester 8)'
      : 'Active Cohort';

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
            <Shield size={12} />
            <span>Verified Campus Credential</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
            {portalTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            {portalSubtitle}
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleEditClick}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition-all active:scale-95 shrink-0"
          >
            <Edit2 size={14} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 animate-tab-fade">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 animate-tab-fade">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg('')}
            className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400 hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Identity & Editor Card */}
      <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Profile Identity Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar
                src={user?.profilePhotoUrl}
                name={user?.fullName || user?.username}
                size="xl"
                shape="circle"
                roleBadgeColor={roleBadgeColor}
                className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-primary/80 shadow-md"
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {user?.fullName || user?.username}
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                {user?.rollNumber && (
                  <>
                    <span>
                      Roll No: <strong className="text-primary font-bold">{user.rollNumber}</strong>
                    </span>
                    <span className="text-muted-foreground/60">•</span>
                  </>
                )}
                {user?.employeeId && (
                  <>
                    <span>
                      Emp ID: <strong className="text-primary font-bold">{user.employeeId}</strong>
                    </span>
                    <span className="text-muted-foreground/60">•</span>
                  </>
                )}
                <span>
                  Role: <strong className="text-foreground">{user?.role}</strong>
                </span>
              </div>

              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  <span>ACTIVE CAMPUS CREDENTIAL • 2026</span>
                </span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={submitting}
                className="px-3.5 py-2 rounded-xl bg-surface-secondary hover:bg-surface-secondary/80 text-foreground border border-border text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* VIEW MODE vs EDIT MODE */}
        {!isEditing ? (
          /* ======================================================== */
          /* VIEW MODE                                                */
          /* ======================================================== */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Department & Assignment */}
              <div className="bg-surface-secondary/50 p-5 rounded-2xl border border-border space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-primary block">
                  Institutional Assignment
                </span>

                <div className="flex items-start gap-3 text-muted-foreground">
                  <div className="p-2 rounded-lg bg-surface border border-border text-primary shrink-0 mt-0.5">
                    <Building size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-mono">Department / Unit</div>
                    <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                      {user?.department || (user?.branch ? `Department of ${user.branch}` : 'General Administration')}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-muted-foreground">
                  <div className="p-2 rounded-lg bg-surface border border-border text-primary shrink-0 mt-0.5">
                    <Award size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-mono">
                      {isStudent ? 'Academic Standing' : 'Designation / Title'}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                      {isStudent ? academicStanding : user?.designation || user?.role}
                    </div>
                  </div>
                </div>

                {user?.specialization && (
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-surface border border-border text-primary shrink-0 mt-0.5">
                      <Briefcase size={15} />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">Specialization</div>
                      <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                        {user.specialization}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact & Residential Allocation */}
              <div className="bg-surface-secondary/50 p-5 rounded-2xl border border-border space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-sky-600 dark:text-sky-400 block">
                  Contact Records &amp; Channels
                </span>

                <div className="flex items-start gap-3 text-muted-foreground">
                  <div className="p-2 rounded-lg bg-surface border border-border text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                    <Mail size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase font-mono flex items-center gap-1.5">
                      <span>Official Campus Email</span>
                      <span title="Managed by campus auth" className="inline-flex items-center">
                        <Lock size={10} className="text-muted-foreground" />
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5 font-mono truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-muted-foreground">
                  <div className="p-2 rounded-lg bg-surface border border-border text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                    <Phone size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-mono">
                      {isStudent ? 'Personal Mobile' : 'Duty / Office Mobile'}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5 font-mono">
                      {user?.phone || 'Not provided'}
                    </div>
                  </div>
                </div>

                {isStudent && user?.parentPhone && (
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-surface border border-border text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                      <Phone size={15} />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">Emergency Contact</div>
                      <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5 font-mono">
                        {user.parentPhone}
                      </div>
                    </div>
                  </div>
                )}

                {user?.hostelBlock && (
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-surface border border-border text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                      <Home size={15} />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">Hostel Allocation</div>
                      <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                        {user.hostelBlock} {user.roomNumber ? `/ Room ${user.roomNumber}` : ''}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bio / About Box */}
            <div className="bg-surface-secondary/50 p-5 rounded-2xl border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-1.5">
                  <FileText size={12} className="text-primary" />
                  <span>About &amp; Professional Statement</span>
                </span>
                {!user?.bio && (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="text-[11px] text-primary hover:underline font-mono"
                  >
                    + Add Bio
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                {user?.bio || (
                  <span className="text-muted-foreground italic">
                    No personal statement or bio provided yet. Click &ldquo;Edit Profile&rdquo; to add a brief introduction.
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* EDIT MODE                                                */
          /* ======================================================== */
          <form onSubmit={handleSubmit} className="space-y-5 animate-tab-fade">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Edit2 size={16} className="text-primary" />
                  <span>Edit Profile Information</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Update your profile photo, contact channels, departmental details, and bio statement.
                </p>
              </div>
            </div>

            {/* Dedicated Profile Photo Area */}
            <div className="bg-surface-secondary/50 p-4 sm:p-5 rounded-2xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-primary flex items-center gap-1.5">
                  <Camera size={13} />
                  <span>Profile Photo</span>
                </span>
                {formData.profilePhotoUrl ? (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Custom Photo Active
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-muted-foreground bg-surface border border-border px-2 py-0.5 rounded-full">
                    Default Initials Active
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pt-1">
                {/* Circular DP Preview */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-primary/80 bg-surface shadow-md flex items-center justify-center">
                    <Avatar
                      src={formData.profilePhotoUrl}
                      name={formData.fullName || user?.username}
                      size="xl"
                      shape="circle"
                      roleBadgeColor={roleBadgeColor}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Upload / Change & Remove Controls */}
                <div className="flex-1 text-center sm:text-left space-y-2.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <label
                      htmlFor="profile-photo-input"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-secondary text-foreground border border-border hover:border-primary text-xs font-semibold cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <Upload size={14} className="text-primary" />
                      <span>{formData.profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </label>

                    <input
                      id="profile-photo-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />

                    {formData.profilePhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setRemoveModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold active:scale-95 transition-all"
                      >
                        <Trash2 size={13} />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Upload a clear profile photo. JPG, PNG or WEBP. Maximum 5 MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-foreground font-semibold mb-1">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-surface border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-foreground font-semibold mb-1">
                  {isStudent ? 'Personal Mobile Number' : 'Duty / Mobile Phone'}
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-surface border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Department */}
              <div>
                <label className="block text-foreground font-semibold mb-1">
                  Department / Operational Unit
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & Engineering / Maintenance"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-surface border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-foreground font-semibold mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  disabled={isStudent}
                  value={isStudent ? 'Student' : formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className={`w-full border rounded-xl p-3 text-xs sm:text-sm ${
                    isStudent
                      ? 'bg-surface-secondary border-border text-muted-foreground cursor-not-allowed'
                      : 'bg-surface border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary'
                  }`}
                />
                {isStudent && (
                  <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                    Student designation is managed by university admissions.
                  </span>
                )}
              </div>
            </div>

            {/* Specialization or Parent Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {isStudent ? (
                <div>
                  <label className="block text-foreground font-semibold mb-1">
                    Emergency / Parent Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9876500001"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-foreground font-semibold mb-1">
                    Specialization Area (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ELECTRICAL, PLUMBING, CSE_FACULTY, ACADEMIC_AFFAIRS"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-foreground font-semibold text-xs">
                  Bio / About Statement
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formData.bio.length}/1000
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={1000}
                placeholder="Share a short bio, research focus, guidance interests, or office hours..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-surface border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-secondary/80 text-foreground border border-border text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Save size={15} />
                <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />

      {/* Remove Photo Confirmation Modal */}
      <RemovePhotoConfirmModal
        isOpen={removeModalOpen}
        loading={removingPhoto}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={handleConfirmRemovePhoto}
      />
    </div>
  );
}
