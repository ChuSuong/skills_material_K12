// ----------------------------------------------------------------------------------------------------------
// Pattern mirrored from rotating-cannon/Assets/Simulation/RotatingGunSimulation.cs
//
// Physics: theta'' = -(g / L) * sin(theta) - damping * omega
// Integrated with semi-implicit (symplectic) Euler, which stays stable for an
// oscillating system at the timesteps Unity's Update() runs at.
// ----------------------------------------------------------------------------------------------------------
using UnityEngine;

public class PendulumSimulation : Simulation
{
    [Header("Scene references")]
    public Transform pivot;
    public Transform bob;
    public LineRenderer stringRenderer;
    public Arrow velocityArrow;
    public Arrow gravityArrow;
    public Arrow tensionArrow;
    public PendulumState state;

    [Header("Parameters (used when no PendulumState asset is assigned)")]
    public float length = 2f;
    public float gravity = 9.81f;
    [Range(-90, 90)] public float initialAngle = 30f;
    public float damping = 0f;
    [Range(0, 1)] public float timeScale = 1f;

    [Header("Display options")]
    public bool showVelocity;
    public bool showGravity;
    public bool showTension;
    public float arrowScale = 0.3f;

    // Internal physics state, radians / rad-per-second
    private float theta;
    private float omega;

    private void Awake()
    {
        SetTimeScale(timeScale);
        InitializeFromState();
    }

    private void OnEnable()
    {
        PendulumState.OnChangeLength += HandleParameterChange;
        PendulumState.OnChangeGravity += HandleParameterChange;
        PendulumState.OnReset += HandleReset;
    }

    private void OnDisable()
    {
        PendulumState.OnChangeLength -= HandleParameterChange;
        PendulumState.OnChangeGravity -= HandleParameterChange;
        PendulumState.OnReset -= HandleReset;
    }

    private void InitializeFromState()
    {
        if (state)
        {
            length = state.length;
            gravity = state.gravity;
            damping = state.damping;
            theta = state.theta * Mathf.Deg2Rad;
            omega = state.omega * Mathf.Deg2Rad;
        }
        else
        {
            theta = initialAngle * Mathf.Deg2Rad;
            omega = 0f;
        }

        UpdateBobPosition();
        UpdateVectors();
    }

    private void Update()
    {
        if (IsPaused) return;

        float dt = Time.deltaTime;

        float angularAcceleration = -(gravity / length) * Mathf.Sin(theta) - damping * omega;
        omega += angularAcceleration * dt;
        theta += omega * dt;

        UpdateBobPosition();
        UpdateVectors();

        if (state)
        {
            state.theta = theta * Mathf.Rad2Deg;
            state.omega = omega * Mathf.Rad2Deg;
        }
    }

    private void UpdateBobPosition()
    {
        if (!pivot || !bob) return;

        // Pivot at the top, bob hangs down; theta measured from the vertical
        Vector3 offset = new Vector3(Mathf.Sin(theta), -Mathf.Cos(theta), 0) * length;
        bob.position = pivot.position + offset;

        if (stringRenderer)
        {
            stringRenderer.positionCount = 2;
            stringRenderer.SetPosition(0, pivot.position);
            stringRenderer.SetPosition(1, bob.position);
        }
    }

    private void UpdateVectors()
    {
        // Velocity is tangential to the swing: v = L * omega * (cos(theta), sin(theta), 0)
        if (velocityArrow)
        {
            velocityArrow.gameObject.SetActive(showVelocity);
            if (showVelocity)
            {
                Vector3 velocity = length * omega * new Vector3(Mathf.Cos(theta), Mathf.Sin(theta), 0);
                velocityArrow.SetComponents(velocity * arrowScale);
            }
        }

        if (gravityArrow)
        {
            gravityArrow.gameObject.SetActive(showGravity);
            if (showGravity)
            {
                gravityArrow.SetComponents(Vector3.down * gravity * arrowScale);
            }
        }

        if (tensionArrow)
        {
            tensionArrow.gameObject.SetActive(showTension);
            if (showTension)
            {
                // Tension magnitude for a point mass on a massless rod/string (m = 1): T = g cos(theta) + L omega^2
                float tensionMagnitude = gravity * Mathf.Cos(theta) + length * omega * omega;
                Vector3 tensionDirection = new Vector3(-Mathf.Sin(theta), Mathf.Cos(theta), 0); // bob -> pivot
                tensionArrow.SetComponents(tensionDirection * tensionMagnitude * arrowScale);
            }
        }
    }

    private void HandleParameterChange()
    {
        if (!state) return;
        length = state.length;
        gravity = state.gravity;
        damping = state.damping;
    }

    private void HandleReset()
    {
        if (!state) return;
        theta = state.theta * Mathf.Deg2Rad;
        omega = 0f;
        UpdateBobPosition();
        UpdateVectors();
    }

    public void SetTimeScale(float newTimeScale)
    {
        timeScale = newTimeScale;
        Time.timeScale = newTimeScale;
    }

    public void SetInitialAngleDegrees(float degrees)
    {
        theta = degrees * Mathf.Deg2Rad;
        omega = 0f;
        if (state) state.SetInitialAngle(degrees);
        UpdateBobPosition();
        UpdateVectors();
    }

    public void SetLength(float newLength)
    {
        length = Mathf.Max(0.1f, newLength);
        if (state) state.SetLength(newLength);
    }

    public void SetGravity(float newGravity)
    {
        gravity = Mathf.Max(0f, newGravity);
        if (state) state.SetGravity(newGravity);
    }

    public void SetVelocityVisibility(bool isVisible) => showVelocity = isVisible;
    public void SetGravityVisibility(bool isVisible) => showGravity = isVisible;
    public void SetTensionVisibility(bool isVisible) => showTension = isVisible;
}
