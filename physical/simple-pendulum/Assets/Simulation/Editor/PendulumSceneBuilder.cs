// ----------------------------------------------------------------------------------------------------------
// Automates the scene-assembly step that would otherwise require manual drag-and-drop
// in the Unity Editor: creates Pivot/Bob/String/Arrows, the PendulumState asset, wires
// every reference on PendulumSimulation, and saves the scene.
//
// Run from the Editor menu: Tools > Pendulum > Build Sandbox Scene
// Run headless from a terminal (no GUI needed) once Unity Editor is installed:
//   Unity -batchmode -quit -projectPath <path-to-simple-pendulum> \
//         -executeMethod PendulumSceneBuilder.BuildSceneFromCommandLine
// ----------------------------------------------------------------------------------------------------------
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class PendulumSceneBuilder
{
    private const string ArrowPrefabPath = "Assets/Components/Arrows/Arrow.prefab";
    private const string StatePath = "Assets/Simulation/PendulumState.asset";
    private const string ScenePath = "Assets/Modules/Sandbox/Sandbox.unity";

    // Entry point for -executeMethod from the command line (opens the target scene first)
    public static void BuildSceneFromCommandLine()
    {
        EditorSceneManager.OpenScene(ScenePath);
        BuildScene();
    }

    [MenuItem("Tools/Pendulum/Build Sandbox Scene")]
    public static void BuildScene()
    {
        PendulumState state = GetOrCreateState();

        GameObject pivotObj = GetOrCreate("Pivot");
        pivotObj.transform.position = new Vector3(0, 5, 0);

        GameObject bobObj = GameObject.Find("Bob");
        if (bobObj == null)
        {
            bobObj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            bobObj.name = "Bob";
            bobObj.transform.localScale = Vector3.one * 0.6f;
        }

        GameObject stringObj = GetOrCreate("String");
        LineRenderer lr = stringObj.GetComponent<LineRenderer>();
        if (lr == null) lr = stringObj.AddComponent<LineRenderer>();
        lr.positionCount = 2;
        lr.startWidth = lr.endWidth = 0.05f;
        if (lr.sharedMaterial == null)
        {
            lr.sharedMaterial = new Material(Shader.Find("Sprites/Default"));
        }

        GameObject arrowPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(ArrowPrefabPath);
        if (arrowPrefab == null)
        {
            Debug.LogError($"Arrow prefab not found at {ArrowPrefabPath} — check the path matches this project's Components folder.");
            return;
        }

        GameObject velocityArrow = FindOrInstantiate(arrowPrefab, "VelocityArrow");
        GameObject gravityArrow = FindOrInstantiate(arrowPrefab, "GravityArrow");
        GameObject tensionArrow = FindOrInstantiate(arrowPrefab, "TensionArrow");

        GameObject simObj = GetOrCreate("PendulumSim");
        PendulumSimulation sim = simObj.GetComponent<PendulumSimulation>();
        if (sim == null) sim = simObj.AddComponent<PendulumSimulation>();

        sim.pivot = pivotObj.transform;
        sim.bob = bobObj.transform;
        sim.stringRenderer = lr;
        sim.velocityArrow = velocityArrow.GetComponent<Arrow>();
        sim.gravityArrow = gravityArrow.GetComponent<Arrow>();
        sim.tensionArrow = tensionArrow.GetComponent<Arrow>();
        sim.state = state;

        EditorUtility.SetDirty(simObj);
        EditorSceneManager.MarkSceneDirty(SceneManager.GetActiveScene());
        EditorSceneManager.SaveScene(SceneManager.GetActiveScene());

        Debug.Log("Pendulum scene assembled and saved: Pivot, Bob, String, 3 Arrows, PendulumSim all wired.");
    }

    private static PendulumState GetOrCreateState()
    {
        PendulumState state = AssetDatabase.LoadAssetAtPath<PendulumState>(StatePath);
        if (state == null)
        {
            state = ScriptableObject.CreateInstance<PendulumState>();
            AssetDatabase.CreateAsset(state, StatePath);
            AssetDatabase.SaveAssets();
        }
        return state;
    }

    private static GameObject GetOrCreate(string name)
    {
        GameObject obj = GameObject.Find(name);
        return obj != null ? obj : new GameObject(name);
    }

    private static GameObject FindOrInstantiate(GameObject prefab, string name)
    {
        GameObject existing = GameObject.Find(name);
        if (existing != null) return existing;

        GameObject instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
        instance.name = name;
        return instance;
    }
}
