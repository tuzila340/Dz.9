using WebPush;
using Dz._9.Models;
using System.Text.Json;
using System.Collections.Concurrent;
using WebPushSubscription = WebPush.PushSubscription;
using AppPushSubscription = Dz._9.Models.PushSubscriptions;

namespace AspNet.MinimalApi.PushNotifications.Services;

public interface IPushNotificationService
{
    string GetVapidPublicKey();
    Task<string> GenerateVapidKeysAsync();
    Task SubscribeAsync(AppPushSubscription subscription);
    Task UnsubscribeAsync(string endpoint);
    Task SendNotificationAsync(NotificationPayload payload);
    Task SendNotificationToSubscriberAsync(string endpoint, NotificationPayload payload);
    IEnumerable<AppPushSubscription> GetAllSubscriptions();
    int GetSubscriptionCount();
    Task SendNotificationToUserAsync(int userId, NotificationPayload payload);
}

public class PushNotificationService : IPushNotificationService
{
    private readonly WebPushClient _webPushClient;
    private readonly VapidDetails _vapidDetails;
    private readonly ConcurrentDictionary<string, AppPushSubscription> _subscriptions;
    private readonly ILogger<PushNotificationService> _logger;

    public PushNotificationService(IConfiguration configuration, ILogger<PushNotificationService> logger)
    {
        _logger = logger;
        _subscriptions = new ConcurrentDictionary<string, AppPushSubscription>();

        var vapidKeys = VapidHelper.GenerateVapidKeys();
        var publicKey = configuration["Vapid:PublicKey"] ?? vapidKeys.PublicKey;
        var privateKey = configuration["Vapid:PrivateKey"] ?? vapidKeys.PrivateKey;
        var subject = configuration["Vapid:Subject"] ?? "mailto:admin@example.com";

        _logger.LogInformation("VAPID Public Key: {PublicKey}", publicKey);

        _vapidDetails = new VapidDetails(subject, publicKey, privateKey);
        _webPushClient = new WebPushClient();
    }

    public string GetVapidPublicKey() => _vapidDetails.PublicKey;

    public Task<string> GenerateVapidKeysAsync()
    {
        var vapidKeys = VapidHelper.GenerateVapidKeys();
        var result = JsonSerializer.Serialize(new
        {
            vapidKeys.PublicKey,
            vapidKeys.PrivateKey
        });
        return Task.FromResult(result);
    }

    public Task SubscribeAsync(AppPushSubscription subscription)
    {
        if (string.IsNullOrEmpty(subscription.Endpoint))
            throw new ArgumentException("Endpoint cannot be null or empty", nameof(subscription));

        _subscriptions.AddOrUpdate(subscription.Endpoint, subscription, (_, _) => subscription);
        _logger.LogInformation("New subscription added: {Endpoint}", subscription.Endpoint);

        return Task.CompletedTask;
    }

    public Task UnsubscribeAsync(string endpoint)
    {
        if (string.IsNullOrEmpty(endpoint))
            throw new ArgumentException("Endpoint cannot be null or empty", nameof(endpoint));

        _subscriptions.TryRemove(endpoint, out _);
        _logger.LogInformation("Subscription removed: {Endpoint}", endpoint);

        return Task.CompletedTask;
    }

    public async Task SendNotificationAsync(NotificationPayload payload)
    {
        var tasks = _subscriptions.Values
            .Select(sub => SendNotificationToSubscriberAsync(sub.Endpoint, payload));

        await Task.WhenAll(tasks);
    }

    public async Task SendNotificationToSubscriberAsync(string endpoint, NotificationPayload payload)
    {
        if (!_subscriptions.TryGetValue(endpoint, out var subscription))
        {
            _logger.LogWarning("Subscription not found: {Endpoint}", endpoint);
            return;
        }

        try
        {

            var pushSubscription = new WebPushSubscription(
                subscription.Endpoint,
                subscription.P256dh,
                subscription.Auth);

            var payloadJson = JsonSerializer.Serialize(payload);

            await _webPushClient.SendNotificationAsync(pushSubscription, payloadJson, _vapidDetails);
            _logger.LogInformation("Notification sent to: {Endpoint}", endpoint);
        }
        catch (WebPushException ex)
        {
            _logger.LogError(ex, "Failed to send to: {Endpoint}. Status: {StatusCode}", 
                endpoint, ex.StatusCode);
            
            if (ex.StatusCode is System.Net.HttpStatusCode.Gone
                or System.Net.HttpStatusCode.NotFound
                or System.Net.HttpStatusCode.Unauthorized)
            {
                _logger.LogWarning("Removing invalid subscription: {Endpoint}", endpoint);
                await UnsubscribeAsync(endpoint);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending to: {Endpoint}", endpoint);
        }
    }
    
    public async Task SendNotificationToUserAsync(int userId, NotificationPayload payload)
    {
        var userSubscriptions = _subscriptions.Values
            .Where(s => s.UserId == userId)
            .ToList();

        if (!userSubscriptions.Any())
        {
            _logger.LogWarning("No subscriptions found for UserId: {UserId}", userId);
            return;
        }

        var tasks = userSubscriptions
            .Select(sub => SendNotificationToSubscriberAsync(sub.Endpoint, payload));

        await Task.WhenAll(tasks);
    }

    public IEnumerable<AppPushSubscription> GetAllSubscriptions() => 
        _subscriptions.Values.ToList();

    public int GetSubscriptionCount() => _subscriptions.Count;
}