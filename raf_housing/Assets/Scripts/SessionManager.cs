using UnityEngine;

public class SessionManager : MonoBehaviour
{
    public static SessionManager Instance { get; private set; }

    public string AuthToken { get; private set; }

    private void Awake()
    {
        if (Instance != null && Instance != this) 
        {
            Destroy(this.gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(Instance);
    }

    public void SetAuthToken(string token) 
    {
        AuthToken = token;
    }
}
