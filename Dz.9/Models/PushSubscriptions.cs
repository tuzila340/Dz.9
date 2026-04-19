using System.Security.Cryptography;

namespace Dz._9.Models;

public class PushSubscriptions
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Endpoint { get; set; }
    public string P256dh { get; set; }
    public string Auth { get; set; }
}

public class NotificationPayload
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Badge { get; set; }
    public string? Image { get; set; }
    public string? Tag { get; set; }
    public bool RequireInteraction { get; set; } = false;
    public bool Silent { get; set; } = false;
    public int[]? Vibrate { get; set; }
    public Dictionary<string, object>? Data { get; set; }
    public NotificationAction[]? Actions { get; set; }
}

public class NotificationAction
{
    public string Action { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Icon { get; set; }
}

public class SendNotificationRequest
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Url { get; set; }
}
