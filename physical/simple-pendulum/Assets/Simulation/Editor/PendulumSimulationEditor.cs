// ----------------------------------------------------------------------------------------------------------
// Pattern mirrored from rotating-cannon/Assets/Simulation/Editor/RotatingGunSimulationEditor.cs
// ----------------------------------------------------------------------------------------------------------
using UnityEditor;
using UnityEngine;

[CustomEditor(typeof(PendulumSimulation))]
public class PendulumSimulationEditor : Editor
{
    private PendulumSimulation sim;

    private void OnEnable()
    {
        sim = target as PendulumSimulation;
    }

    public override void OnInspectorGUI()
    {
        DrawDefaultInspector();

        if (GUI.changed)
        {
            sim.SetTimeScale(sim.timeScale);
        }
    }
}
