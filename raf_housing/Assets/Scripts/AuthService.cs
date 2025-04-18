using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class AuthService : MonoBehaviour
{
    [Header("URL Reference")]
    public BackendConfig config;

    public static string signedInUser; // for grabbing the username after successful login in game scene.

    public IEnumerator SignUp(string username, string email, string password, System.Action<bool, string> callback)
    {
        var payload = new SignUpRequest{username = username, email = email, password = password};
        string jsonData = JsonUtility.ToJson(payload);

        string url = config.baseUrl + "/api/auth/signup";

        using (UnityWebRequest www = new UnityWebRequest(url, "POST")) 
        {
            www.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(jsonData));
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");

            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                callback(true, www.downloadHandler.text);
            }
            else 
            {
                callback(false, www.downloadHandler.text);
            }
        }
    }

    public IEnumerator SignIn(string username, string password, System.Action<bool, string> callback) 
    {
        var payload = new SignUpRequest { username = username, password = password };
        string jsonData = JsonUtility.ToJson(payload);

        string url = config.baseUrl + "/api/auth/signin";

        using (UnityWebRequest www = new UnityWebRequest(url, "POST")) 
        {
            www.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(jsonData));
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");

            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                callback(true, www.downloadHandler.text);
            }
            else
            {
                callback(false, www.downloadHandler.text);
            }
        }
    }

    [System.Serializable]
    public class SignUpRequest
    {
        public string username;
        public string email;
        public string password;
    }

    [System.Serializable]
    public class SignInRequest
    {
        public string username;
        public string password;
    }

    [System.Serializable]
    public class SignInResponse
    {
        public string token;
        public string message;
    }

}


