using UnityEngine;
using System.Collections;
using UnityEngine.Networking;
using System;

public class CloudSave : MonoBehaviour
{
    public LocalSaveManager localSaveManager;

    private string serverUrl = "http://localhost:3000/sync";

    public void SyncWithCloud() 
    {
        StartCoroutine(SyncRoutine());
    }

    private IEnumerator SyncRoutine()
    {
        PlayerData localData = localSaveManager.playerData;
        string localJson = JsonUtility.ToJson(localData);

        WWWForm form = new WWWForm();   

        form.AddField("plainJson", localJson);

        using (UnityWebRequest www = UnityWebRequest.Post(serverUrl, form)) 
        {
            yield return www.SendWebRequest();
            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.Log($"Sync Error: {www.error}");
            }
            else 
            {
                string serverResponse = www.downloadHandler.text;
                PlayerData serverData = JsonUtility.FromJson<PlayerData>(serverResponse);

                Debug.Log(serverData.playerName);
                localSaveManager.playerData = serverData;
                localSaveManager.SaveToLocal();

                Debug.Log("Sync successful");
            } 
        }
    }
}
