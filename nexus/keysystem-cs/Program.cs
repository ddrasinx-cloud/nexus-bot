using System;
using System.Drawing;
using System.IO;
using System.Management;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Windows.Forms;

class NexusKeyForm : Form
{
    private TextBox keyInput;
    private Button verifyBtn, discordBtn;
    private Label resultLabel, statusLabel, hwidLabel, expiryLabel, titleLabel;
    private bool dragging;
    private Point dragStart;
    private readonly string apiUrl;
    private readonly string hwid;

    static readonly Color BG = Color.FromArgb(26, 26, 46);
    static readonly Color PANEL = Color.FromArgb(40, 40, 64);
    static readonly Color ACCENT = Color.FromArgb(0, 240, 255);
    static readonly Color PURPLE = Color.FromArgb(123, 47, 247);
    static readonly Color TEXT = Color.FromArgb(192, 192, 192);
    static readonly Color DIM = Color.FromArgb(100, 100, 140);
    static readonly Color INPUT_BG = Color.FromArgb(18, 18, 36);
    static readonly Color ERROR = Color.FromArgb(255, 0, 85);
    static readonly Color SUCCESS = Color.FromArgb(0, 240, 255);

    public NexusKeyForm()
    {
        apiUrl = LoadApiUrl();
        hwid = ComputeHwid();
        SetupForm();
        SetupUI();
        UpdateHwidDisplay();
        CheckApi();
    }

    string LoadApiUrl()
    {
        try
        {
            var cfg = Path.Combine(Application.StartupPath, "api-url.txt");
            if (File.Exists(cfg))
                return File.ReadAllText(cfg).Trim();
        }
        catch { }
        return "http://127.0.0.1:3000";
    }

    string ComputeHwid()
    {
        var sb = new StringBuilder();
        try
        {
            using (var searcher = new ManagementObjectSearcher("SELECT VolumeSerialNumber FROM Win32_LogicalDisk WHERE Name='C:'"))
            using (var results = searcher.Get())
                foreach (var obj in results)
                {
                    var val = obj["VolumeSerialNumber"];
                    if (val != null) sb.Append(val.ToString());
                }
        }
        catch { sb.Append("NOVOL"); }
        try
        {
            using (var searcher = new ManagementObjectSearcher("SELECT MACAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled=True"))
            using (var results = searcher.Get())
                foreach (var obj in results)
                {
                    var val = obj["MACAddress"];
                    if (val != null) { sb.Append(val.ToString()); break; }
                }
        }
        catch { sb.Append("NOMAC"); }
        try
        {
            using (var searcher = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor"))
            using (var results = searcher.Get())
                foreach (var obj in results)
                {
                    var val = obj["ProcessorId"];
                    if (val != null) { sb.Append(val.ToString()); break; }
                }
        }
        catch { sb.Append("NOCPU"); }
        using (var sha = SHA256.Create())
        {
            var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));
            return "HWID-" + BitConverter.ToString(hash).Replace("-", "").Substring(0, 16);
        }
    }

    void SetupForm()
    {
        Text = "NEXUS Key System";
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        Size = new Size(460, 420);
        BackColor = BG;
        TopMost = true;
        ShowInTaskbar = true;
    }

    void SetupUI()
    {
        titleLabel = new Label
        {
            Text = "NEXUS Key System v2.0",
            ForeColor = DIM,
            BackColor = Color.Transparent,
            Font = new Font("Segoe UI", 9, FontStyle.Regular),
            Size = new Size(420, 24),
            Location = new Point(12, 8),
            Cursor = Cursors.SizeAll
        };
        titleLabel.MouseDown += (s, e) => { dragging = true; dragStart = e.Location; };
        titleLabel.MouseMove += (s, e) => { if (dragging) Location = new Point(Location.X + e.X - dragStart.X, Location.Y + e.Y - dragStart.Y); };
        titleLabel.MouseUp += (s, e) => dragging = false;
        Controls.Add(titleLabel);

        var closeBtn = new Button
        {
            Text = "X",
            ForeColor = Color.White,
            BackColor = Color.FromArgb(50, 50, 72),
            FlatStyle = FlatStyle.Flat,
            Size = new Size(28, 24),
            Location = new Point(418, 8),
            Cursor = Cursors.Hand
        };
        closeBtn.FlatAppearance.BorderSize = 0;
        closeBtn.Click += (s, e) => Application.Exit();
        Controls.Add(closeBtn);

        var logoLabel = new Label
        {
            Text = "NEXUS",
            ForeColor = Color.White,
            BackColor = Color.Transparent,
            Font = new Font("Segoe UI", 28, FontStyle.Bold),
            Size = new Size(440, 50),
            Location = new Point(10, 38),
            TextAlign = ContentAlignment.MiddleCenter
        };
        Controls.Add(logoLabel);

        var subLabel = new Label
        {
            Text = "KEY VERIFICATION SYSTEM",
            ForeColor = DIM,
            BackColor = Color.Transparent,
            Font = new Font("Segoe UI", 8, FontStyle.Regular),
            Size = new Size(440, 16),
            Location = new Point(10, 82),
            TextAlign = ContentAlignment.MiddleCenter
        };
        Controls.Add(subLabel);

        var panel = new Panel
        {
            BackColor = PANEL,
            Size = new Size(420, 180),
            Location = new Point(20, 105)
        };
        Controls.Add(panel);

        var inputLabel = new Label
        {
            Text = "LICENSE KEY",
            ForeColor = DIM,
            BackColor = Color.Transparent,
            Font = new Font("Segoe UI", 8, FontStyle.Regular),
            Size = new Size(400, 14),
            Location = new Point(12, 12)
        };
        panel.Controls.Add(inputLabel);

        keyInput = new TextBox
        {
            BackColor = INPUT_BG,
            ForeColor = Color.White,
            Font = new Font("Consolas", 16, FontStyle.Bold),
            BorderStyle = BorderStyle.FixedSingle,
            Size = new Size(302, 36),
            Location = new Point(12, 30),
            TextAlign = HorizontalAlignment.Center
        };
        keyInput.KeyDown += (s, e) => { if (e.KeyCode == Keys.Enter) VerifyKey(); };
        panel.Controls.Add(keyInput);

        verifyBtn = new Button
        {
            Text = "VERIFY",
            ForeColor = Color.Black,
            BackColor = ACCENT,
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 11, FontStyle.Bold),
            Size = new Size(90, 36),
            Location = new Point(320, 29),
            Cursor = Cursors.Hand
        };
        verifyBtn.FlatAppearance.BorderSize = 0;
        verifyBtn.Click += (s, e) => VerifyKey();
        panel.Controls.Add(verifyBtn);

        resultLabel = new Label
        {
            Text = "Enter a key to verify.",
            ForeColor = DIM,
            BackColor = Color.FromArgb(26, 26, 46),
            Font = new Font("Segoe UI", 11, FontStyle.Regular),
            Size = new Size(396, 50),
            Location = new Point(12, 72),
            TextAlign = ContentAlignment.MiddleLeft,
            Padding = new Padding(8)
        };
        panel.Controls.Add(resultLabel);

        hwidLabel = new Label
        {
            Text = "",
            ForeColor = Color.FromArgb(60, 60, 80),
            BackColor = Color.Transparent,
            Font = new Font("Consolas", 7, FontStyle.Regular),
            Size = new Size(420, 16),
            Location = new Point(12, 128),
            TextAlign = ContentAlignment.MiddleLeft
        };
        panel.Controls.Add(hwidLabel);

        expiryLabel = new Label
        {
            Text = "",
            ForeColor = Color.Transparent,
            BackColor = Color.Transparent,
            Font = new Font("Segoe UI", 9, FontStyle.Regular),
            Size = new Size(420, 20),
            Location = new Point(12, 148),
            TextAlign = ContentAlignment.MiddleLeft
        };
        panel.Controls.Add(expiryLabel);

        discordBtn = new Button
        {
            Text = "Join Discord",
            ForeColor = Color.White,
            BackColor = Color.FromArgb(88, 101, 242),
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 9, FontStyle.Regular),
            Size = new Size(130, 28),
            Location = new Point(20, 300),
            Cursor = Cursors.Hand
        };
        discordBtn.FlatAppearance.BorderSize = 0;
        discordBtn.Click += (s, e) => { try { System.Diagnostics.Process.Start("https://discord.gg/qAEg7dPnwg"); } catch { } };
        Controls.Add(discordBtn);

        statusLabel = new Label
        {
            Text = "Connecting...",
            ForeColor = Color.Gray,
            BackColor = Color.FromArgb(22, 22, 38),
            Font = new Font("Segoe UI", 8, FontStyle.Regular),
            Size = new Size(460, 24),
            Location = new Point(0, 396),
            TextAlign = ContentAlignment.MiddleCenter
        };
        Controls.Add(statusLabel);
    }

    void UpdateHwidDisplay()
    {
        hwidLabel.Text = "HWID: " + hwid;
    }

    async void CheckApi()
    {
        try
        {
            using (var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) })
            {
                var resp = await client.GetStringAsync(apiUrl + "/health");
                statusLabel.Text = "Connected to NEXUS API";
                statusLabel.ForeColor = ACCENT;
                statusLabel.BackColor = Color.FromArgb(0, 30, 40);
            }
        }
        catch
        {
            statusLabel.Text = "API offline - enter key to retry";
            statusLabel.ForeColor = ERROR;
            statusLabel.BackColor = Color.FromArgb(40, 0, 10);
        }
    }

    async void VerifyKey()
    {
        var key = keyInput.Text.Trim().ToUpper();
        if (string.IsNullOrEmpty(key))
        {
            resultLabel.Text = "Enter a key first.";
            resultLabel.ForeColor = DIM;
            return;
        }

        verifyBtn.Enabled = false;
        verifyBtn.Text = "...";
        resultLabel.Text = "Verifying...";
        resultLabel.ForeColor = DIM;

        try
        {
            using (var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) })
            {
                var json = "{\"key\":\"" + key.Replace("\"", "\\\"") + "\",\"hwid\":\"" + hwid + "\"}";
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var resp = await client.PostAsync(apiUrl + "/api/verify-key-noauth", content);
                var body = await resp.Content.ReadAsStringAsync();

                if (body.Contains("\"valid\":true"))
                {
                    var isLifetime = body.Contains("\"isLifetime\":true");
                    var expiresAt = ExtractJson(body, "expiresAt");
                    var durationStr = ExtractJson(body, "duration");
                    var dur = 0;
                    int.TryParse(durationStr, out dur);

                    var durLabel = dur == -1 ? "Lifetime" : dur + "d";
                    resultLabel.Text = "VALID KEY - " + durLabel;
                    resultLabel.ForeColor = SUCCESS;
                    resultLabel.BackColor = Color.FromArgb(0, 30, 40);

                    if (isLifetime || dur == -1)
                    {
                        expiryLabel.Text = "Status: LIFETIME ACCESS";
                        expiryLabel.ForeColor = PURPLE;
                    }
                    else if (expiresAt != "")
                    {
                        long expMs = 0;
                        long.TryParse(expiresAt, out expMs);
                        if (expMs > 0)
                        {
                            var expDate = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddMilliseconds(expMs).ToLocalTime();
                            var remaining = expDate - DateTime.Now;
                            var daysLeft = (int)Math.Max(0, remaining.TotalDays);
                            expiryLabel.Text = "Expires: " + expDate.ToShortDateString() + " (" + daysLeft + " days left)";
                            expiryLabel.ForeColor = daysLeft < 3 ? ERROR : SUCCESS;
                        }
                    }
                    else
                    {
                        expiryLabel.Text = "Status: " + dur + " day" + (dur != 1 ? "s" : "");
                        expiryLabel.ForeColor = SUCCESS;
                    }

                    statusLabel.Text = "Key verified - " + durLabel;
                    statusLabel.ForeColor = SUCCESS;
                }
                else
                {
                    var err = ExtractJson(body, "error");
                    resultLabel.Text = "INVALID - " + (err != "" ? err : "Key not found");
                    resultLabel.ForeColor = ERROR;
                    resultLabel.BackColor = Color.FromArgb(40, 0, 10);
                    expiryLabel.Text = "";
                }
            }
        }
        catch
        {
            resultLabel.Text = "Connection error - check API URL";
            resultLabel.ForeColor = ERROR;
            resultLabel.BackColor = Color.FromArgb(40, 0, 10);
        }

        verifyBtn.Enabled = true;
        verifyBtn.Text = "VERIFY";
    }

    string ExtractJson(string json, string key)
    {
        var search = "\"" + key + "\":\"";
        var idx = json.IndexOf(search);
        if (idx < 0)
        {
            search = "\"" + key + "\":";
            idx = json.IndexOf(search);
            if (idx < 0) return "";
            idx += search.Length;
            var end = json.IndexOf(',', idx);
            if (end < 0) end = json.IndexOf('}', idx);
            if (end < 0) return "";
            var val = json.Substring(idx, end - idx);
            return val.Trim().Trim('"');
        }
        idx += search.Length;
        var end2 = json.IndexOf('"', idx);
        if (end2 < 0) return "";
        return json.Substring(idx, end2 - idx);
    }

    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        Application.Run(new NexusKeyForm());
    }
}
