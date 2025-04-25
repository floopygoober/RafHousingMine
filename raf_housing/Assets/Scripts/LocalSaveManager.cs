using UnityEngine;
using System;
using System.IO;
using System.Collections.Generic;
public class LocalSaveManager : MonoBehaviour
{
    public PlayerData playerData;
    private string filename = "LocalSaveRafHousing.json";

    private void Awake()
    {
        LoadFromLocal(); 
    }

    public void LoadFromLocal() 
    {
        string path = Path.Combine(Application.dataPath, filename); //datapath is the apps data path, 
        if (File.Exists(path))
        {
            string json = File.ReadAllText(path);
            playerData = JsonUtility.FromJson<PlayerData>(json);
            Debug.Log("Game Data loaded from " + path);
            Debug.Log($"user: {playerData.playerName}");
        }
        else 
        {
            Debug.LogWarning($"No save file found at {path} Creating a new data file.");
            playerData = new PlayerData
            {
                playerName = "default name",
                sliderValue = 0.5f
                // no default houses for you. get out. go get a job and buy a house.
                // this isnt a game that just gives you free houses you bum you need to earn them
            };
        }
    }

    public void SaveToLocal() 
    {

        // find all the houses in this fine well established neighbourhood.
        GameObject[] HousieDoodles = GameObject.FindGameObjectsWithTag("House");

        foreach (GameObject homie in HousieDoodles) 
        {
            HouseData HouseToAdd = new HouseData();

            HouseToAdd.Rotation = homie.transform.rotation;
            HouseToAdd.Position = homie.transform.position;
            
            playerData.housePrefabs.Add(HouseToAdd);
        }

        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long unixTime = dto.ToUnixTimeSeconds();

        playerData.sliderValue = ChangeWorld.sliderValue;
        playerData.timeOfSave = (int)unixTime;
        string json = JsonUtility.ToJson(playerData);
        // persistent data path is the place unity saves its game data to. this is like steams App data which is why its seperated from the unity files.
        // this is a per user thing.
        string path = Path.Combine(Application.persistentDataPath, filename);

        File.WriteAllText(path, json);
        Debug.Log("Local save completed at: " + path);
        
        TelemetryManager.Instance.LogEvent("saveDateTime", new Dictionary<string, object> {
            {"timeOfSave", System.DateTime.UtcNow.ToString("o") }
        });
    }
}
