using UnityEngine;
using System.Collections.Generic;

public class SessionTracker : MonoBehaviour
{
    private float sessionStartTime = 0f;

    private void Start()
    {
        sessionStartTime = Time.time;

        TelemetryManager.Instance.LogEvent("session_start", new Dictionary<string, object> {
            {"startTime", System.DateTime.Now.ToString("o")}
        });
    }

    private void Awake()
    {
        DontDestroyOnLoad(this.gameObject);
    }
    private void OnApplicationQuit()
    {
        float sessionDuration = Time.time - sessionStartTime;
        Debug.Log(sessionDuration);
        TelemetryManager.Instance.LogEvent("session_end", new Dictionary<string, object> {
            {"duration_sec", sessionDuration},
            {"endTime", System.DateTime.UtcNow.ToString("o")}
        });
    }
}
