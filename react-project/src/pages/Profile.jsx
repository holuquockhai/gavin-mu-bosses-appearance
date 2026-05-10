import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getCurrentUserApi, getUserProfileApi, updateProfileApi, USER_API_URL } from "../api/userApi";
import { getUser, updateStoredUser } from "../utils/auth";
import { formatUserDate, formatUserDateTime } from "../utils/dateTime";

const COUNTRY_OPTIONS = [
  "Australia",
  "Cambodia",
  "Canada",
  "China",
  "France",
  "Germany",
  "Indonesia",
  "Japan",
  "Laos",
  "Malaysia",
  "New Zealand",
  "Philippines",
  "Singapore",
  "South Korea",
  "Thailand",
  "United Kingdom",
  "United States",
  "Vietnam",
];

function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl) {
    return "";
  }

  return avatarUrl.startsWith("http") ? avatarUrl : `${USER_API_URL}${avatarUrl}`;
}

function mergeUserForSession(baseUser, updatedUser) {
  return {
    ...baseUser,
    ...updatedUser,
    roles: baseUser?.roles || updatedUser.roles?.map((role) => role.name || role) || [],
  };
}

function formatJoinedDate(value) {
  return formatUserDate(value);
}

function formatLastLogin(value) {
  return formatUserDateTime(value);
}

function Profile() {
  const { userId } = useParams();
  const location = useLocation();
  const storedUser = getUser();
  const isOwnProfile = !userId || Number(userId) === Number(storedUser?.id);
  const [fullName, setFullName] = useState(storedUser?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(storedUser?.phone_number || "");
  const [country, setCountry] = useState(storedUser?.country || "");
  const [bio, setBio] = useState(storedUser?.bio || "");
  const [email, setEmail] = useState(storedUser?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(storedUser?.avatar_url || "");
  const [createdAt, setCreatedAt] = useState(storedUser?.created_at || "");
  const [lastLoginAt, setLastLoginAt] = useState(storedUser?.last_login_at || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const mustUpdatePassword = Boolean(storedUser?.must_update_password);

  const previewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    return resolveAvatarUrl(avatarUrl);
  }, [avatarFile, avatarUrl]);

  useEffect(() => {
    const loadProfile = isOwnProfile ? getCurrentUserApi : () => getUserProfileApi(userId);

    loadProfile()
      .then((user) => {
        setFullName(user.full_name || "");
        setPhoneNumber(user.phone_number || "");
        setCountry(user.country || "");
        setBio(user.bio || "");
        setEmail(user.email || "");
        setAvatarUrl(user.avatar_url || "");
        setCreatedAt(user.created_at || "");
        setLastLoginAt(user.last_login_at || "");
        if (isOwnProfile) {
          updateStoredUser(mergeUserForSession(storedUser, user));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOwnProfile, userId]);

  useEffect(() => {
    return () => {
      if (avatarFile && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [avatarFile, previewUrl]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password && password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setIsSaving(true);
    try {
      if (mustUpdatePassword && !password) {
        setError("Please set a new password before continuing.");
        setIsSaving(false);
        return;
      }

      const user = await updateProfileApi({
        full_name: fullName,
        phone_number: phoneNumber,
        country,
        bio,
        password,
        avatar: avatarFile,
      });
      const updatedUser = mergeUserForSession(getUser(), user);

      updateStoredUser(updatedUser);
      setAvatarUrl(user.avatar_url || "");
      setAvatarFile(null);
      setPassword("");
      setConfirmPassword("");
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update profile.");
    } finally {
      setIsSaving(false);
    }
  };
  const joinedDate = formatJoinedDate(createdAt);
  const lastLoginText = formatLastLogin(lastLoginAt);

  if (!isOwnProfile) {
    return (
      <div className="card border-0 shadow-sm unified profile-card overflow-hidden">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-4">
              <p className="small text-muted mb-0">Loading profile...</p>
            </div>
          ) : (
            <div className="profile-detail-view">
              <div className="profile-page-header">
                <h3 className="mb-1">Warlords profile</h3>
                <p className="small text-muted mb-0">View this user's public profile details.</p>
              </div>

              <div className="profile-hero">
                <div className="profile-avatar-section">
                  {previewUrl ? (
                    <img src={previewUrl} alt={`${fullName || "User"} avatar`} className="profile-avatar-preview" />
                  ) : (
                    <div className="profile-avatar-preview profile-avatar-empty">
                      {(fullName || email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="mb-1">{fullName || "Unnamed user"}</h3>
                  </div>
                </div>

              </div>

              <div className="profile-content">
                <div className="profile-detail-item">
                  <span className="profile-detail-label">Full name</span>
                  <strong>{fullName || "-"}</strong>
                </div>

                <div className="profile-detail-item">
                  <span className="profile-detail-label">Email</span>
                  <strong>{email || "-"}</strong>
                </div>

                <div className="profile-detail-item">
                  <span className="profile-detail-label">Phone number</span>
                  <strong>{phoneNumber || "-"}</strong>
                </div>

                <div className="profile-detail-item">
                  <span className="profile-detail-label">Country</span>
                  <strong>{country || "-"}</strong>
                </div>

                <div className="profile-detail-item profile-detail-item-wide mt-2">
                  <span className="profile-detail-label">Bio</span>
                  <p className="mb-0">{bio || "No bio added yet."}</p>
                </div>

                <div className="profile-meta profile-meta-after-bio profile-detail-item-wide">
                  <div className="profile-meta-item">
                    <span>Joined</span>
                    <strong>{joinedDate || "-"}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span>Last login</span>
                    <strong>{lastLoginText || "-"}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm unified profile-card overflow-hidden">
      <div className="card-body p-0">
        <div className="profile-page-header">
          <h3 className="mb-1">Warlords profile</h3>
          <p className="small text-muted mb-0">Update your account details and public profile information.</p>
        </div>

        <div className="profile-hero">
          <div className="profile-avatar-section">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile avatar preview" className="profile-avatar-preview" />
            ) : (
              <div className="profile-avatar-preview profile-avatar-empty">
                {(fullName || email || "U").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="mb-1">{fullName || "Unnamed user"}</h3>
            </div>
          </div>

        </div>

        <div className="profile-content">
        {(mustUpdatePassword || location.state?.requirePasswordUpdate) && (
          <div className="alert alert-warning">
            Please update your temporary password before continuing.
          </div>
        )}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="profile-section">
            <div>
              <h6 className="profile-section-title">Avatar</h6>
              <p className="small text-muted mb-0">Use a clear image so teammates can recognize you in notifications.</p>
            </div>
            <div>
              <input
                id="profileAvatar"
                type="file"
                className="form-control"
                accept="image/png,image/jpeg,image/gif,image/webp"
                disabled={isLoading || isSaving}
                onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
              />
              <div className="form-text">PNG, JPG, GIF, or WEBP image.</div>
            </div>
          </div>

          <div className="profile-section">
            <div>
              <h6 className="profile-section-title">Identity</h6>
              <p className="small text-muted mb-0">Your display name and short bio are visible to other users.</p>
            </div>
            <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="profileFullName" className="form-label">Full name</label>
              <input
                id="profileFullName"
                type="text"
                className="form-control"
                value={fullName}
                disabled={isLoading || isSaving || !isOwnProfile}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="profileEmail" className="form-label">Email</label>
              <input id="profileEmail" type="email" className="form-control" value={email} disabled />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="profilePhoneNumber" className="form-label">Phone number</label>
              <input
                id="profilePhoneNumber"
                type="tel"
                className="form-control"
                value={phoneNumber}
                disabled={isLoading || isSaving}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="profileCountry" className="form-label">Country</label>
              <select
                id="profileCountry"
                className="form-select"
                value={country}
                disabled={isLoading || isSaving}
                onChange={(event) => setCountry(event.target.value)}
              >
                <option value="">Select country</option>
                {COUNTRY_OPTIONS.map((countryName) => (
                  <option key={countryName} value={countryName}>
                    {countryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label htmlFor="profileBio" className="form-label">Bio</label>
              <textarea
                id="profileBio"
                className="form-control"
                rows={4}
                maxLength={500}
                value={bio}
                disabled={isLoading || isSaving || !isOwnProfile}
                onChange={(event) => setBio(event.target.value)}
              ></textarea>
              {isOwnProfile && <div className="form-text">{bio.length}/500 characters</div>}
            </div>

            <div className="col-12">
              <div className="profile-meta profile-meta-after-bio">
                <div className="profile-meta-item">
                  <span>Joined</span>
                  <strong>{joinedDate || "-"}</strong>
                </div>
                <div className="profile-meta-item">
                  <span>Last login</span>
                  <strong>{lastLoginText || "-"}</strong>
                </div>
              </div>
            </div>
            </div>
          </div>

            {isOwnProfile && (
              <div className="profile-section">
                <div>
                  <h6 className="profile-section-title">Security</h6>
                  <p className="small text-muted mb-0">Leave these fields empty if you do not want to change your password.</p>
                </div>
                <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="profilePassword" className="form-label">New password</label>
                  <input
                    id="profilePassword"
                    type="password"
                    className="form-control"
                    minLength={6}
                    required={mustUpdatePassword}
                    value={password}
                    disabled={isLoading || isSaving}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="profileConfirmPassword" className="form-label">Confirm password</label>
                  <input
                    id="profileConfirmPassword"
                    type="password"
                    className="form-control"
                    minLength={6}
                    required={mustUpdatePassword}
                    value={confirmPassword}
                    disabled={isLoading || isSaving}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
                </div>
              </div>
            )}

          {isOwnProfile && (
            <div className="d-flex justify-content-end mt-4">
              <button type="submit" className="btn btn-outline-success me-2" disabled={isLoading || isSaving}>
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
