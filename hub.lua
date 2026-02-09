-- WindUI Script Hub Example
-- This is a basic script hub using WindUI library

local RunService = game:GetService("RunService")

local cloneref = (cloneref or clonereference or function(instance) return instance end)
local ReplicatedStorage = cloneref(game:GetService("ReplicatedStorage"))

local WindUI

do
    local ok, result = pcall(function()
        return require("./src/Init")
    end)
    
    if ok then
        WindUI = result
    else 
        if cloneref(game:GetService("RunService")):IsStudio() then
            WindUI = require(cloneref(ReplicatedStorage:WaitForChild("WindUI"):WaitForChild("Init")))
        else
            WindUI = loadstring(game:HttpGet("https://raw.githubusercontent.com/Footagesus/WindUI/main/dist/main.lua"))()
        end
    end
end

-- Create the main window
local Window = WindUI:CreateWindow({
    Title = "My Script Hub | WindUI",
    Icon = "solar:settings-bold",
    Folder = "myscripthub",
    NewElements = true,
    OpenButton = {
        Title = "Open Hub",
        CornerRadius = UDim.new(1,0),
        Enabled = true,
        Draggable = true,
        Scale = 0.5,
        Color = ColorSequence.new(
            Color3.fromHex("#FF6B6B"), 
            Color3.fromHex("#4ECDC4")
        )
    },
    Topbar = {
        Height = 44,
        ButtonsType = "Mac",
    },
})

-- Add a version tag
Window:Tag({
    Title = "v1.0",
    Icon = "solar:star-bold",
    Color = Color3.fromHex("#FFD700"),
    Border = true,
})

-- Colors
local Green = Color3.fromHex("#10C550")
local Blue = Color3.fromHex("#257AF7")
local Red = Color3.fromHex("#EF4F1D")

-- Movement Tab
do
    local MovementTab = Window:Tab({
        Title = "Movement",
        Icon = "solar:running-bold",
        IconColor = Green,
        Border = true,
    })
    
    -- Infinite Jump
    local InfiniteJumpEnabled = false
    MovementTab:Toggle({
        Title = "Infinite Jump",
        Desc = "Jump anywhere",
        Callback = function(enabled)
            InfiniteJumpEnabled = enabled
            if enabled then
                local UserInputService = game:GetService("UserInputService")
                UserInputService.JumpRequest:Connect(function()
                    if InfiniteJumpEnabled then
                        local Humanoid = game.Players.LocalPlayer.Character:FindFirstChild("Humanoid")
                        if Humanoid then
                            Humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
                        end
                    end
                end)
                WindUI:Notify({
                    Title = "Infinite Jump",
                    Content = "Enabled",
                    Icon = "solar:arrow-up-bold",
                })
            else
                WindUI:Notify({
                    Title = "Infinite Jump",
                    Content = "Disabled",
                    Icon = "solar:arrow-down-bold",
                })
            end
        end
    })
    
    MovementTab:Space()
    
    -- Speed Hack
    local SpeedMultiplier = 1
    MovementTab:Slider({
        Title = "Speed Multiplier",
        Desc = "Increase walk speed",
        Value = {
            Min = 1,
            Max = 10,
            Default = 1,
        },
        Callback = function(value)
            SpeedMultiplier = value
            local Humanoid = game.Players.LocalPlayer.Character:FindFirstChild("Humanoid")
            if Humanoid then
                Humanoid.WalkSpeed = 16 * value
            end
        end
    })
    
    MovementTab:Space()
    
    -- Fly
    local FlyEnabled = false
    local FlySpeed = 50
    MovementTab:Toggle({
        Title = "Fly",
        Desc = "Fly around the map",
        Callback = function(enabled)
            FlyEnabled = enabled
            local Player = game.Players.LocalPlayer
            local Character = Player.Character
            local Humanoid = Character:FindFirstChild("Humanoid")
            local RootPart = Character:FindFirstChild("HumanoidRootPart")
            
            if enabled then
                Humanoid.PlatformStand = true
                local BodyVelocity = Instance.new("BodyVelocity")
                BodyVelocity.Velocity = Vector3.new(0, 0, 0)
                BodyVelocity.MaxForce = Vector3.new(4000, 4000, 4000)
                BodyVelocity.Parent = RootPart
                
                local UserInputService = game:GetService("UserInputService")
                local RunService = game:GetService("RunService")
                
                local flying = true
                local keys = {w = false, a = false, s = false, d = false}
                
                UserInputService.InputBegan:Connect(function(input)
                    if flying then
                        if input.KeyCode == Enum.KeyCode.W then keys.w = true
                        elseif input.KeyCode == Enum.KeyCode.A then keys.a = true
                        elseif input.KeyCode == Enum.KeyCode.S then keys.s = true
                        elseif input.KeyCode == Enum.KeyCode.D then keys.d = true
                        end
                    end
                end)
                
                UserInputService.InputEnded:Connect(function(input)
                    if input.KeyCode == Enum.KeyCode.W then keys.w = false
                    elseif input.KeyCode == Enum.KeyCode.A then keys.a = false
                    elseif input.KeyCode == Enum.KeyCode.S then keys.s = false
                    elseif input.KeyCode == Enum.KeyCode.D then keys.d = false
                    end
                end)
                
                RunService.RenderStepped:Connect(function()
                    if flying then
                        local direction = Vector3.new()
                        if keys.w then direction = direction + (workspace.CurrentCamera.CFrame.LookVector) end
                        if keys.s then direction = direction - (workspace.CurrentCamera.CFrame.LookVector) end
                        if keys.a then direction = direction - (workspace.CurrentCamera.CFrame.RightVector) end
                        if keys.d then direction = direction + (workspace.CurrentCamera.CFrame.RightVector) end
                        BodyVelocity.Velocity = direction * FlySpeed
                    end
                end)
                
                WindUI:Notify({
                    Title = "Fly",
                    Content = "Enabled - Use WASD to fly",
                    Icon = "solar:plane-bold",
                })
            else
                Humanoid.PlatformStand = false
                local BodyVelocity = RootPart:FindFirstChild("BodyVelocity")
                if BodyVelocity then BodyVelocity:Destroy() end
                WindUI:Notify({
                    Title = "Fly",
                    Content = "Disabled",
                    Icon = "solar:plane-bold",
                })
            end
        end
    })
end

-- Combat Tab
do
    local CombatTab = Window:Tab({
        Title = "Combat",
        Icon = "solar:sword-bold",
        IconColor = Red,
        Border = true,
    })
    
    -- Auto Click
    local AutoClickEnabled = false
    CombatTab:Toggle({
        Title = "Auto Click",
        Desc = "Automatically click mouse",
        Callback = function(enabled)
            AutoClickEnabled = enabled
            if enabled then
                while AutoClickEnabled do
                    mouse1click()
                    wait(0.1) -- Adjust speed as needed
                end
            end
        end
    })
    
    CombatTab:Space()
    
    -- ESP
    CombatTab:Toggle({
        Title = "ESP",
        Desc = "See players through walls",
        Callback = function(enabled)
            if enabled then
                for _, player in pairs(game.Players:GetPlayers()) do
                    if player ~= game.Players.LocalPlayer and player.Character then
                        local highlight = Instance.new("Highlight")
                        highlight.FillColor = Color3.fromRGB(255, 0, 0)
                        highlight.OutlineColor = Color3.fromRGB(255, 255, 255)
                        highlight.Parent = player.Character
                    end
                end
                WindUI:Notify({
                    Title = "ESP",
                    Content = "Enabled",
                    Icon = "solar:eye-bold",
                })
            else
                for _, player in pairs(game.Players:GetPlayers()) do
                    if player.Character then
                        local highlight = player.Character:FindFirstChild("Highlight")
                        if highlight then highlight:Destroy() end
                    end
                end
                WindUI:Notify({
                    Title = "ESP",
                    Content = "Disabled",
                    Icon = "solar:eye-closed-bold",
                })
            end
        end
    })
end

-- Teleport Tab
do
    local TeleportTab = Window:Tab({
        Title = "Teleport",
        Icon = "solar:map-point-bold",
        IconColor = Blue,
        Border = true,
    })
    
    -- Teleport to Player
    local PlayersList = {}
    for _, player in pairs(game.Players:GetPlayers()) do
        if player ~= game.Players.LocalPlayer then
            table.insert(PlayersList, player.Name)
        end
    end
    
    TeleportTab:Dropdown({
        Title = "Teleport to Player",
        Values = PlayersList,
        Callback = function(selectedPlayerName)
            local selectedPlayer = game.Players:FindFirstChild(selectedPlayerName)
            if selectedPlayer and selectedPlayer.Character and selectedPlayer.Character:FindFirstChild("HumanoidRootPart") then
                game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = selectedPlayer.Character.HumanoidRootPart.CFrame
                WindUI:Notify({
                    Title = "Teleport",
                    Content = "Teleported to " .. selectedPlayerName,
                    Icon = "solar:map-point-bold",
                })
            end
        end
    })
    
    TeleportTab:Space()
    
    -- Teleport to Location (example coordinates)
    TeleportTab:Button({
        Title = "Teleport to Spawn",
        Desc = "Go back to spawn point",
        Callback = function()
            local spawn = workspace:FindFirstChild("SpawnLocation") or workspace:FindFirstChild("Spawn")
            if spawn then
                game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = spawn.CFrame
            else
                -- Fallback to origin or something
                game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(0, 10, 0)
            end
            WindUI:Notify({
                Title = "Teleport",
                Content = "Teleported to spawn",
                Icon = "solar:home-bold",
            })
        end
    })
end

-- Settings Tab
do
    local SettingsTab = Window:Tab({
        Title = "Settings",
        Icon = "solar:settings-bold",
        Border = true,
    })
    
    SettingsTab:Button({
        Title = "Destroy Hub",
        Color = Color3.fromHex("#ff4830"),
        Callback = function()
            Window:Destroy()
            WindUI:Notify({
                Title = "Hub Destroyed",
                Content = "Goodbye!",
                Icon = "solar:trash-bold",
            })
        end
    })
end

print("Script Hub loaded successfully!")
