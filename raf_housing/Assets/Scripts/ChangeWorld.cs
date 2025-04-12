using UnityEngine;
using UnityEngine.UI;

public class ChangeWorld : MonoBehaviour
{
    public BlobGenerator generator;
    public static float sliderValue;

    public void NewWorld() 
    {
        float value = GetComponent<Slider>().value;
        sliderValue = value;
        generator.GenerateBlob((int)(value * 100));
    }
}


