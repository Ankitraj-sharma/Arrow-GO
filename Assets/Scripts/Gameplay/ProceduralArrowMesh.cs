using System.Collections.Generic;
using UnityEngine;

namespace ArrowGo.Gameplay
{
    /// <summary>
    /// Procedurally builds an aerodynamic 3D Cyber Arrow model in code at runtime.
    /// Includes a sharp supersonic nosecone, faceted fuselage, 3 stabilizer delta fins,
    /// and a rear energy thruster nozzle.
    /// Eliminates the need for external 3D .FBX assets and works out-of-the-box!
    /// </summary>
    [RequireComponent(typeof(MeshFilter), typeof(MeshRenderer))]
    [ExecuteInEditMode]
    public class ProceduralArrowMesh : MonoBehaviour
    {
        [Header("Arrow Dimensions")]
        [SerializeField] private float totalLength = 2.4f;
        [SerializeField] private float bodyRadius = 0.22f;
        [SerializeField] private float tipLength = 0.9f;
        [SerializeField] private float finSpan = 0.65f;
        [SerializeField] private float finLength = 0.7f;

        [Header("Material & Shader")]
        [SerializeField] private Material defaultMaterial;

        private MeshFilter _meshFilter;
        private MeshRenderer _meshRenderer;

        private void Awake()
        {
            _meshFilter = GetComponent<MeshFilter>();
            _meshRenderer = GetComponent<MeshRenderer>();

            EnsureMaterial();
            GenerateMesh();
        }

        private void EnsureMaterial()
        {
            if (_meshRenderer.sharedMaterial == null)
            {
                // Standard or Universal Render Pipeline shader fallback
                Shader shader = Shader.Find("Universal Render Pipeline/Lit") 
                             ?? Shader.Find("Standard") 
                             ?? Shader.Find("Sprites/Default");
                if (shader != null)
                {
                    Material mat = new Material(shader);
                    mat.name = "Mat_CyberArrow_Procedural";
                    mat.color = new Color(0.0f, 1.0f, 0.8f); // Default Neon Cyan
                    _meshRenderer.sharedMaterial = mat;
                }
            }
        }

        [ContextMenu("Regenerate Mesh")]
        public void GenerateMesh()
        {
            Mesh mesh = new Mesh();
            mesh.name = "Mesh_Procedural_CyberArrow";

            List<Vector3> vertices = new List<Vector3>();
            List<int> triangles = new List<int>();
            List<Vector3> normals = new List<Vector3>();
            List<Vector2> uvs = new List<Vector2>();

            float halfLen = totalLength * 0.5f;
            Vector3 tipPoint = new Vector3(0f, halfLen, 0f);
            Vector3 tipBase = new Vector3(0f, halfLen - tipLength, 0f);
            Vector3 tailPoint = new Vector3(0f, -halfLen, 0f);

            int radialSegments = 6;
            List<Vector3> ringMid = new List<Vector3>();
            List<Vector3> ringTail = new List<Vector3>();

            // 1. Generate Body Rings
            for (int i = 0; i < radialSegments; i++)
            {
                float angle = i * Mathf.PI * 2f / radialSegments;
                float x = Mathf.Cos(angle) * bodyRadius;
                float z = Mathf.Sin(angle) * bodyRadius;

                ringMid.Add(new Vector3(x, tipBase.y, z));
                ringTail.Add(new Vector3(x * 0.75f, tailPoint.y, z * 0.75f)); // slight taper towards tail
            }

            // 2. Nosecone (Tip to Mid Ring)
            for (int i = 0; i < radialSegments; i++)
            {
                int next = (i + 1) % radialSegments;

                int v0 = vertices.Count;
                vertices.Add(tipPoint);
                vertices.Add(ringMid[i]);
                vertices.Add(ringMid[next]);

                triangles.Add(v0);
                triangles.Add(v0 + 1);
                triangles.Add(v0 + 2);

                uvs.Add(new Vector2(0.5f, 1f));
                uvs.Add(new Vector2((float)i / radialSegments, 0.6f));
                uvs.Add(new Vector2((float)(i + 1) / radialSegments, 0.6f));
            }

            // 3. Main Shaft / Fuselage Quads
            for (int i = 0; i < radialSegments; i++)
            {
                int next = (i + 1) % radialSegments;

                int v0 = vertices.Count;
                vertices.Add(ringMid[i]);
                vertices.Add(ringTail[i]);
                vertices.Add(ringTail[next]);
                vertices.Add(ringMid[next]);

                // Quad triangle 1
                triangles.Add(v0);
                triangles.Add(v0 + 1);
                triangles.Add(v0 + 2);

                // Quad triangle 2
                triangles.Add(v0);
                triangles.Add(v0 + 2);
                triangles.Add(v0 + 3);

                uvs.Add(new Vector2((float)i / radialSegments, 0.6f));
                uvs.Add(new Vector2((float)i / radialSegments, 0f));
                uvs.Add(new Vector2((float)(i + 1) / radialSegments, 0f));
                uvs.Add(new Vector2((float)(i + 1) / radialSegments, 0.6f));
            }

            // 4. Stabilizer Fins (3 fins at 120-degree intervals)
            for (int f = 0; f < 3; f++)
            {
                float angle = f * Mathf.PI * 2f / 3f;
                Vector3 finDir = new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle));

                Vector3 finRootFront = tailPoint + new Vector3(0f, finLength, 0f) + finDir * (bodyRadius * 0.8f);
                Vector3 finRootBack = tailPoint + finDir * (bodyRadius * 0.6f);
                Vector3 finTip = tailPoint + new Vector3(0f, finLength * 0.25f, 0f) + finDir * finSpan;

                int v0 = vertices.Count;
                // Double-sided fin geometry
                vertices.Add(finRootFront);
                vertices.Add(finRootBack);
                vertices.Add(finTip);

                triangles.Add(v0);
                triangles.Add(v0 + 1);
                triangles.Add(v0 + 2);

                triangles.Add(v0);
                triangles.Add(v0 + 2);
                triangles.Add(v0 + 1);

                uvs.Add(new Vector2(0f, 1f));
                uvs.Add(new Vector2(0f, 0f));
                uvs.Add(new Vector2(1f, 0.5f));
            }

            // 5. Rear Thruster Cap
            int capCenter = vertices.Count;
            vertices.Add(tailPoint);
            uvs.Add(new Vector2(0.5f, 0.5f));

            for (int i = 0; i < radialSegments; i++)
            {
                int next = (i + 1) % radialSegments;
                int v0 = vertices.Count;
                vertices.Add(ringTail[i]);
                vertices.Add(ringTail[next]);

                triangles.Add(capCenter);
                triangles.Add(v0 + 1);
                triangles.Add(v0);

                uvs.Add(new Vector2(0f, 0f));
                uvs.Add(new Vector2(1f, 0f));
            }

            mesh.vertices = vertices.ToArray();
            mesh.triangles = triangles.ToArray();
            mesh.uv = uvs.ToArray();
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            if (_meshFilter == null) _meshFilter = GetComponent<MeshFilter>();
            _meshFilter.sharedMesh = mesh;
        }
    }
}
