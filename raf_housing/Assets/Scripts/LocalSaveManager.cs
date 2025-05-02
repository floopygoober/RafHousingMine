using UnityEngine;
using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine.Networking;
using System.Collections;
using System.Text;
using Unity.VisualScripting.Antlr3.Runtime;
using UnityEditor;
public class LocalSaveManager : MonoBehaviour
{
    public PlayerData playerData;
    private string filename = "LocalSaveRafHousing.json";
    [SerializeField] private GameObject housePrefabToSpawn;
    
    string serverEndPoint = "http://localhost:3000/api/protected"; // used to verify token in this file. 

    private void Awake()
    {
        //LoadFromLocal();
    }

    //C:\Users\alimg\AppData\LocalLow\DefaultCompany\RafHousing2D - the path it is actually saved to.
    //C:/Users/alimg/RafHousingMine/raf_housing/Assets\LocalSaveRafHousing.json - the path unity is trying to access.

    public void LoadFromLocal()
    {

        string path = Path.Combine(Application.persistentDataPath, filename);

        if (File.Exists(path))
        {
            string json = File.ReadAllText(path); // this load sthe json fine, but then the playerData is left null.


            //it gets here why is player data null.
            playerData = JsonUtility.FromJson<PlayerData>(json);
            Debug.Log("Game Data loaded from " + path);
            Debug.Log($"user: {playerData.playerName}");

            ChangeWorld.sliderValue = playerData.sliderValue;

            // load the houses from the player data.
            foreach (HouseData houseData in playerData.housePrefabs)
            {
                GameObject housePrefab = Instantiate(housePrefabToSpawn, houseData.Position, houseData.Rotation);
                housePrefab.tag = "House"; // set the tag to House so we can find it later.
            }
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


    public void AttemptLoad() 
    {
        StartCoroutine(VerifyToken());
    }

    public IEnumerator VerifyToken() 
    {
        // send off the token we saved locally to the server backend at the /api/protected path it will verify our token internally and send a response back.
        //string token = SessionManager.Instance.AuthToken; // copy the token to our own variable. probably dont need to do it this way

        using (UnityWebRequest www = new UnityWebRequest(serverEndPoint, "GET"))
        {
            www.SetRequestHeader("Content-Type", "application/json");
            www.SetRequestHeader("authorization", "Bearer: " + SessionManager.Instance.AuthToken);

            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning("Your token is stale and gross. get something fresh");
            }
            else 
            {
                // on success, load local save
                LoadFromLocal();
            }
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
            
            // idk why but playerData is null referenced here, yet it is saved everywhere else so im super confused. if i fix this then i know it works, i had it working in class.
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

struct TokenData 
{
    string Title;
    string Token;
}