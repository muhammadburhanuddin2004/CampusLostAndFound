using System.ComponentModel.DataAnnotations;

namespace CampusBackend.Models
{
    public class Item
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty; // "Lost" or "Found"

        [Required]
        public string Location { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public string Contact { get; set; } = string.Empty;

        public string Status { get; set; } = "Active"; // "Active", "Claimed", etc.
        
        [Required]
        public string OwnerEmail { get; set; } = string.Empty; // Tracks who posted it!

        public string? ImageUri { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
