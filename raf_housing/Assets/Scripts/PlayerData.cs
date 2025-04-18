using System.Collections.Generic;
using UnityEngine;


[System.Serializable]
public class PlayerData
{
    public string playerName;
    public float sliderValue;
    public int timeOfSave;
    public List<HouseData> housePrefabs = new List<HouseData>(); // get access to the prefab so we can save the rotation and location of each.        
}


[System.Serializable]
public class HouseData //make a separate class because saving the game object gets the in game id and not the individual data. 
{
    public Vector3 Position;
    public Quaternion Rotation;
}