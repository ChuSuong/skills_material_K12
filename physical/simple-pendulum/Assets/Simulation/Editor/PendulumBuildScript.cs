// ----------------------------------------------------------------------------------------------------------
// Automates the WebGL build step. Sets Compression Format to Disabled (matches the
// EPFL sims — GitHub Pages / static dev servers don't set the Content-Encoding header
// needed for compressed builds, so leaving compression on causes "unable to load
// framework" errors at runtime).
//
// Run headless from a terminal once Unity Editor is installed:
//   Unity -batchmode -quit -projectPath <path-to-simple-pendulum> \
//         -executeMethod PendulumBuildScript.PerformWebGLBuild
// Output lands in <project>/Build/WebGL/ — copy that folder's contents into
// <website-repo>/public/SimplePendulum/Build/
// ----------------------------------------------------------------------------------------------------------
using UnityEditor;

public static class PendulumBuildScript
{
    public static void PerformWebGLBuild()
    {
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
        PlayerSettings.productName = "SimplePendulum";
        PlayerSettings.companyName = "K12Physics";

        string[] scenes = { "Assets/Modules/Sandbox/Sandbox.unity" };

        BuildPipeline.BuildPlayer(new BuildPlayerOptions
        {
            scenes = scenes,
            locationPathName = "Build/WebGL",
            target = BuildTarget.WebGL,
            options = BuildOptions.None,
        });
    }
}
