using UnityEngine;

[CreateAssetMenu(fileName = "BackendConfig", menuName = "Scriptable Objects/BackendConfig")]
public class BackendConfig : ScriptableObject
{
    [Header("Server URL")]
    public string baseUrl;

}
