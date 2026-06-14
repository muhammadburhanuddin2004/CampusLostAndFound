using Microsoft.EntityFrameworkCore;
using CampusBackend.Data;
using CampusBackend.Models;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

using System.Net;
using System.Net.Mail;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Register the Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. CONFIGURE MINIMAL API JSON PARSER (Fixes property casing matching)
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 3. Configure Swagger for all environments during deployment testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Campus API v1");
    c.RoutePrefix = string.Empty; // Makes Swagger load at the root URL
});

// 4. It allows your server to display images to the internet
app.UseStaticFiles();

// ==========================================
// LIVE API ENDPOINTS
// ==========================================

// GET: Fetch all items
app.MapGet("/api/items", async (AppDbContext context) =>
{
    var items = await context.Items.ToListAsync();
    return Results.Ok(items);
});

// POST: Receive a new lost/found item from React Native
app.MapPost("/api/items", async (
    AppDbContext context,
    HttpRequest request,
    IWebHostEnvironment env, // <-- ADD THIS: Injects the hosting environment inspector
    [FromForm] ItemUploadDto dto) =>
{
    try
    {
        string? finalImageUrl = null;

        // Handle file upload if it exists
        if (dto.ImageFile != null && dto.ImageFile.Length > 0)
        {
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.ImageFile.FileName);

            // FIXED: Use env.WebRootPath to target the true public 'wwwroot' folder
            var uploadsFolder = Path.Combine(env.WebRootPath, "uploads");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.ImageFile.CopyToAsync(stream);
            }

            var requestUrl = $"{request.Scheme}://{request.Host}";
            finalImageUrl = $"{requestUrl}/uploads/{fileName}";
        }

        // Map the DTO properties to your original Entity Model
        var newItem = new Item
        {
            Title = dto.Title,
            Type = dto.Type,
            Category = dto.Category,
            Location = dto.Location,
            Description = dto.Description ?? string.Empty,
            Contact = dto.Contact,
            Status = "Active",
            ImageUri = finalImageUrl,
            OwnerEmail = dto.OwnerEmail,
            CreatedAt = DateTime.UtcNow
        };

        context.Items.Add(newItem);
        await context.SaveChangesAsync();

        return Results.Created($"/api/items/{newItem.Id}", newItem);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Database write failed: {ex.Message}");
    }
}).DisableAntiforgery();

// --- AUTH ENDPOINTS ---

// app.MapPost("/api/auth/register", async (AppDbContext context, IConfiguration config, User user) =>
// {
//     var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == user.Email);
//     if (existingUser != null) return Results.BadRequest("User already exists.");

//     var otp = new Random().Next(100000, 999999).ToString();
//     user.Otp = otp;
//     user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
//     user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash); // Ensure BCrypt.Net-Next is installed

//     context.Users.Add(user);
//     await context.SaveChangesAsync();

//     // Send Email
//     var smtp = new SmtpClient(config["EmailSettings:Host"], int.Parse(config["EmailSettings:Port"] ?? "587"))
//     {
//         Credentials = new NetworkCredential(config["EmailSettings:Email"], config["EmailSettings:Password"]),
//         EnableSsl = true
//     };
//     await smtp.SendMailAsync(config["EmailSettings:Email"], user.Email, "Your OTP Code", $"Your code is {otp}");

//     return Results.Ok("User registered. Please check email for OTP.");
// });
app.MapPost("/api/auth/register", async (AppDbContext context, IConfiguration config, User user) =>
{
    try {
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == user.Email);
        if (existingUser != null) return Results.BadRequest("User already exists.");

        var otp = new Random().Next(100000, 999999).ToString();
        user.Otp = otp;
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);

        // Ensure you have "using BCrypt.Net;" at the top
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Email logic...
        return Results.Ok("User registered.");
    }
    catch (Exception ex) {
        return Results.BadRequest(ex.Message); // This will tell us the EXACT reason!
    }
});
// OPEN TESTING ENDPOINT: Accepts any standard email domain (Gmail, Outlook, etc.)
app.MapPost("/api/auth/test-register", async (AppDbContext context, [FromBody] User user) =>
{
    try
    {
        // Lowercase the email to maintain normalized records in your database
        string normalizedEmail = user.Email.Trim().ToLower();

        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (existingUser != null) return Results.BadRequest("User already exists.");

        // Assign core properties to automatically bypass authorization gates
        user.Email = normalizedEmail;
        user.IsVerified = true;
        user.Otp = "000000";
        user.OtpExpiry = DateTime.UtcNow.AddYears(1);
        user.Role = "Student";

        // Securely hash the password string sent from the app device
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return Results.Ok("User account successfully created and verified with a generic email address.");
    }
    catch (Exception ex)
    {
        return Results.BadRequest(ex.Message);
    }
});

app.MapPost("/api/auth/verify", async (AppDbContext context, string email, string otp) =>
{
    var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email && u.Otp == otp);
    if (user == null || user.OtpExpiry < DateTime.UtcNow) return Results.BadRequest("Invalid or expired OTP.");

    user.IsVerified = true;
    user.Otp = null;
    await context.SaveChangesAsync();
    return Results.Ok("Verification successful.");
});

app.MapPost("/api/auth/login", async (AppDbContext context, IConfiguration config, User loginUser) =>
{
    var user = await context.Users.FirstOrDefaultAsync(u => u.Email == loginUser.Email);
    if (user == null || !user.IsVerified || !BCrypt.Net.BCrypt.Verify(loginUser.PasswordHash, user.PasswordHash))
        return Results.Unauthorized();

    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.ASCII.GetBytes(config["JwtSettings:SecretKey"] ?? "");
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Email, user.Email), new Claim(ClaimTypes.Role, user.Role) }),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new { Token = tokenHandler.WriteToken(token) });
});
// GET: Fetch only posts created by a specific user (Fixes Frontend Requirement #1)
app.MapGet("/api/items/my-posts", async (AppDbContext context, [FromQuery] string email) =>
{
    var userPosts = await context.Items
        .Where(i => i.OwnerEmail == email)
        .OrderByDescending(i => i.CreatedAt)
        .ToListAsync();

    return Results.Ok(userPosts);
});

// DELETE: Deletes an item from the campus bulletin entirely (Fixes Admin Requirement #2)
app.MapDelete("/api/items/{id}", async (AppDbContext context, int id) =>
{
    var itemToDelete = await context.Items.FindAsync(id);
    if (itemToDelete == null) return Results.NotFound("Item not found on server.");

    context.Items.Remove(itemToDelete);
    await context.SaveChangesAsync();

    return Results.Ok("Item successfully removed from the bulletin.");
});
// CRITICAL: The execution line must happen BEFORE any class definitions!
app.Run();

// ==========================================
// DATA TRANSFER OBJECTS (At the absolute bottom!)
// ==========================================

public class ItemUploadDto
{
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Contact { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty; // Added to map from the frontend form
    public IFormFile? ImageFile { get; set; }
}
