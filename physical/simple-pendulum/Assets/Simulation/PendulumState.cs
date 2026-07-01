// ----------------------------------------------------------------------------------------------------------
// Pattern mirrored from rotating-cannon/Assets/Simulation/SimulationState.cs
// ----------------------------------------------------------------------------------------------------------
using System;
using UnityEngine;

[CreateAssetMenu(fileName = "New Pendulum State", menuName = "Simulation State/Pendulum", order = 51)]
public class PendulumState : ScriptableObject
{
    [Tooltip("Metres")] public float length = 2f;
    [Tooltip("m / s^2")] public float gravity = 9.81f;
    [Tooltip("Degrees, measured from the vertical")] public float theta;
    [Tooltip("Degrees / s")] public float omega;
    [Tooltip("0 = no friction")] public float damping = 0f;

    public static event Action OnChangeLength;
    public static event Action OnChangeGravity;
    public static event Action OnReset;

    public void SetLength(float newLength)
    {
        length = Mathf.Max(0.1f, newLength);
        OnChangeLength?.Invoke();
    }

    public void SetGravity(float newGravity)
    {
        gravity = Mathf.Max(0f, newGravity);
        OnChangeGravity?.Invoke();
    }

    public void SetDamping(float newDamping)
    {
        damping = Mathf.Max(0f, newDamping);
    }

    public void SetInitialAngle(float degrees)
    {
        theta = degrees;
        omega = 0f;
        OnReset?.Invoke();
    }

    // Valid only in the small-angle regime; useful as a reference value in the Theory module
    public float GetPeriodSmallAngle()
    {
        return (length > 0 && gravity > 0) ? 2 * Mathf.PI * Mathf.Sqrt(length / gravity) : 0f;
    }
}
