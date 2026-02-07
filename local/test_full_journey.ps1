# JourneyIQ Live E2E Test (Minimal)
$email = "devopsexpertlearning@gmail.com"
$name = "DevOps Expert Learning"
$password = "Search&Destroy!1"

Write-Host "STARTING LIVE E2E TEST FOR: $email"

# 1. Register / Login
Write-Host "1. Registering/Logging in..."
$userId = $null
$token = $null

try {
    $regBody = @{ email = $email; password = $password; full_name = $name; role = "TRAVELER" } | ConvertTo-Json
    # Auth Service: :8001/register
    $regResponse = Invoke-RestMethod -Uri "http://localhost:8001/register" -Method POST -Body $regBody -ContentType "application/json" -ErrorAction Stop
    $userId = $regResponse.user_id
    Write-Host "User Created! ID: $userId"
} catch {
    Write-Host "Registration failed or exists. Attempting Login..."
    try {
        $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
        # Auth Service: :8001/login
        $tokenResponse = Invoke-RestMethod -Uri "http://localhost:8001/login" -Method POST -Body $loginBody -ContentType "application/json"
        
        $token = $tokenResponse.access_token
        $payloadPart = $token.Split(".")[1]
        while ($payloadPart.Length % 4) { $payloadPart += "=" }
        $decodedJson = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payloadPart))
        $userId = ($decodedJson | ConvertFrom-Json).sub
        Write-Host "Login Successful! ID: $userId"
    } catch {
        Write-Host "Login Failed: $($_.Exception.Message)"; if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }; exit 1
    }
}

# 2. Search
Write-Host "2. Searching Flights..."
try {
    # CORRECTED PAYLOAD: Use departure_date instead of date
    $searchBody = @{ origin = "JFK"; destination = "LHR"; departure_date = (Get-Date).ToString("yyyy-MM-dd") } | ConvertTo-Json
    # Search Service: :8003/flights
    $flightsResponse = Invoke-RestMethod -Uri "http://localhost:8003/flights" -Method POST -Body $searchBody -ContentType "application/json"
    
    $flightId = $null
    if ($flightsResponse.results -and $flightsResponse.results.Count -gt 0) {
        $flightId = $flightsResponse.results[0].id
    } elseif ($flightsResponse.flights -and $flightsResponse.flights.Count -gt 0) {
        $flightId = $flightsResponse.flights[0].id
    }
    
    if (-not $flightId) { throw "No flights found" }
    Write-Host "Found Flight ID: $flightId"
} catch {
    Write-Host "Search Failed. Using Default. Error: $($_.Exception.Message)"
    $flightId = "f0000000-0000-0000-0000-000000000001"
}

# 3. Book
Write-Host "3. Booking..."
try {
    $pax = @( @{ first_name = "DevOps"; last_name = "Expert"; date_of_birth = "1990-01-01" } )
    $bookBody = @{ user_id = $userId; flight_id = $flightId; passengers = $pax; class_type = "ECONOMY" } | ConvertTo-Json
    # Booking Service: :8006/
    $booking = Invoke-RestMethod -Uri "http://localhost:8006/" -Method POST -Body $bookBody -ContentType "application/json"
    $bookingId = $booking.id
    Write-Host "Booking Created! ID: $bookingId"
} catch {
    Write-Host "Booking Failed: $($_.Exception.Message)"; if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }; exit 1
}

# 4. Payment
Write-Host "4. Paying..."
try {
    $payBody = @{ 
        booking_id = $bookingId
        amount = 550.00
        currency = "USD"
        payment_method = @{ type = "CARD"; card_number = "4242"; expiry = "12/30"; cvv = "123" } 
    } | ConvertTo-Json
    # Payment Service: :8007/
    $payment = Invoke-RestMethod -Uri "http://localhost:8007/" -Method POST -Body $payBody -ContentType "application/json"
    Write-Host "Payment Successful! TxID: $($payment.transaction_id)"
} catch {
    Write-Host "Payment Failed: $($_.Exception.Message)"; if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }; exit 1
}

# 5. Ticket
Write-Host "5. Generatng Ticket..."
$downloadUrl = ""
try {
    $ticketBody = @{ 
        request = @{ booking_id = $bookingId }
        passenger = @{ first_name = "DevOps"; last_name = "Expert"; seat_number = "1A" } 
    } | ConvertTo-Json
    # Ticketing Service: :8008/generate
    $ticket = Invoke-RestMethod -Uri "http://localhost:8008/generate" -Method POST -Body $ticketBody -ContentType "application/json"
    $ticketId = $ticket.ticket_id
    $downloadUrl = "http://localhost:8008/$ticketId/download"
    Write-Host "Ticket Generated! Download: $downloadUrl"
} catch {
    Write-Host "Ticketing Failed: $($_.Exception.Message)"
}

# 6. Notification
Write-Host "6. Triggering Email..."
try {
    $notifBody = @{
        recipient = $email
        subject = "JourneyIQ Booking Confirmed"
        content = "Your flight from JFK to LHR is confirmed! Click below to download your ticket."
        action_url = $downloadUrl
        user_id = $userId
        type = "EMAIL"
    } | ConvertTo-Json
    # Notification Service: :8009/email
    Invoke-RestMethod -Uri "http://localhost:8009/email" -Method POST -Body $notifBody -ContentType "application/json" | Out-Null
    Write-Host "Email Sent to $email"
} catch {
    Write-Host "Notification Trigger Failed"
}

# 7. Check History
Write-Host "7. Checking History..."
Start-Sleep -Seconds 2
try {
    # Notification Service: :8009/history/{id}
    $history = Invoke-RestMethod -Uri "http://localhost:8009/history/$userId"
    if ($history.notifications.Count -gt 0) {
        Write-Host "Success! Found $($history.notifications.Count) Notifications."
        foreach ($n in $history.notifications) { Write-Host " - Type: $($n.type) | Subject: $($n.subject)" }
    } else {
        Write-Host "No notifications found."
    }
} catch {
    Write-Host "Check Failed"
}

# 8. Check IoT
Write-Host "8. Checking IoT..."
try {
   # IoT Service: :8013/devices
   $devBody = @{ device_name = "SmartBag-Test"; device_type = "LUGGAGE"; owner_id = $userId } | ConvertTo-Json
   $devResponse = Invoke-RestMethod -Uri "http://localhost:8013/devices" -Method POST -Body $devBody -ContentType "application/json"
   Write-Host "IoT Device Registered! ID: $($devResponse.id)"
} catch {
   Write-Host "IoT Search Failed." 
}

Write-Host "TEST COMPLETE"
