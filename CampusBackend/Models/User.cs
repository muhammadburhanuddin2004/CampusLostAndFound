using System.ComponentModel.DataAnnotations;

namespace CampusBackend.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = "Student"; // "Student" or "Admin"

        // OTP Verification Fields
        public bool IsVerified { get; set; } = false;
        public string? Otp { get; set; }
        public DateTime? OtpExpiry { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
