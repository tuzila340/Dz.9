using AspNet.MinimalApi.PushNotifications.Services;
using Dz._9.Data;
using Dz._9.Models;
using Microsoft.EntityFrameworkCore;
using WebPush;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/api/users", async (Users user, AppDbContext db) =>
{
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(user);
});

app.MapPost("/api/push/subscribe", async (IPushNotificationService pushService, PushSubscriptions subscription) =>
{
    try
    {
        await pushService.SubscribeAsync(subscription);
        return Results.Ok(new { message = "Підписка успішно створена!" });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/api/push/send/{userId}", async (
    int userId,
    IPushNotificationService pushService,
    SendNotificationRequest request) =>
{
    try
    {
        var payload = new NotificationPayload
        {
            Title = request.Title,
            Body = request.Body,
            Icon = request.Icon ?? "/icon-192x192.svg",
            Badge = "/badge-72x72.svg",
            Data = new Dictionary<string, object>
            {
                ["url"] = request.Url ?? "/"
            }
        };

        await pushService.SendNotificationToUserAsync(userId, payload);

        return Results.Ok(new
        {
            message = $"Нотифікацію відправлено користувачу {userId}!",
            userId
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/api/push/broadcast", async (IPushNotificationService pushService, SendNotificationRequest request) =>
{
    try
    {
        var payload = new NotificationPayload
        {
            Title = request.Title,
            Body = request.Body,
            Icon = request.Icon ?? "/icon-192x192.svg",
            Badge = "/badge-72x72.svg",
            Data = new Dictionary<string, object>
            {
                ["url"] = request.Url ?? "/"
            }
        };

        await pushService.SendNotificationAsync(payload);
        var subscriptionCount = pushService.GetSubscriptionCount();
        return Results.Ok(new {
            message = $"Нотифікацію відправлено {subscriptionCount} підписникам!",
            sentTo = subscriptionCount
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
     
});



app.Run();