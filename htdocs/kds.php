<?php
/**
 * Kitchen Display System (KDS) Module
 * Aura Ilham Management System
 * Designed for local XAMPP/Apache deployment
 */

// 1. Load Environment Variables from root .env file if it exists
function getEnvVariables($envPath = '../.env') {
    $variables = [
        'DB_HOST' => '127.0.0.1',
        'DB_PORT' => '3306',
        'DB_USER' => 'root',
        'DB_PASSWORD' => '',
        'DB_NAME' => 'aurailham',
    ];

    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) continue;
            
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $key = trim($parts[0]);
                $val = trim($parts[1]);
                // Remove quotes if present
                $val = trim($val, '"\'');
                $variables[$key] = $val;
            }
        }
    }
    return $variables;
}

$config = getEnvVariables();

// 2. Database Connection
$dbConnected = false;
$conn = null;
$dbErrorMsg = '';

try {
    $conn = new mysqli(
        $config['DB_HOST'],
        $config['DB_USER'],
        $config['DB_PASSWORD'],
        $config['DB_NAME'],
        intval($config['DB_PORT'])
    );

    if ($conn->connect_error) {
        $dbErrorMsg = "Database Connection Failed: " . $conn->connect_error;
    } else {
        $dbConnected = true;
    }
} catch (Exception $e) {
    $dbErrorMsg = "Database Connection Error: " . $e->getMessage();
}

// 3. Status Transitions (POST Handler)
$alertMessage = "";
$alertType = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && isset($_POST['order_id'])) {
    $orderId = intval($_POST['order_id']);
    $action = $_POST['action'];
    $newStatus = '';

    if ($action === 'start_preparing') {
        $newStatus = 'Preparing';
    } elseif ($action === 'mark_ready') {
        $newStatus = 'Ready';
    }

    if ($newStatus && $dbConnected) {
        $stmt = $conn->prepare("UPDATE `Order` SET order_status = ? WHERE order_id = ?");
        if ($stmt) {
            $stmt->bind_param("si", $newStatus, $orderId);
            if ($stmt->execute()) {
                // Redirect to self to prevent form resubmission
                header("Location: " . $_SERVER['PHP_SELF'] . "?status_updated=" . $orderId . "&new_status=" . $newStatus);
                exit;
            } else {
                $alertMessage = "Error updating order status in database: " . $stmt->error;
                $alertType = "error";
            }
            $stmt->close();
        } else {
            $alertMessage = "Failed to prepare SQL statement.";
            $alertType = "error";
        }
    } else {
        $alertMessage = "Cannot update status: Database is not connected.";
        $alertType = "error";
    }
}

// Helper query function
function fetchAll($conn, $query, $params = [], $types = '') {
    $stmt = $conn->prepare($query);
    if (!$stmt) return [];
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    $stmt->close();
    return $rows;
}

function resolveMenuImageUrl($imageUrl) {
    if (empty($imageUrl)) {
        return '';
    }

    $safeUrl = trim($imageUrl);
    if (strpos($safeUrl, '/images/menu/') === 0) {
        $localPath = __DIR__ . '/../public' . $safeUrl;
        if (file_exists($localPath)) {
            return '../public' . $safeUrl;
        }
    }

    return $safeUrl;
}

// 4. Fetch Active Orders
$activeOrders = [];

if ($dbConnected) {
    // Fetch orders with Pending or Preparing status
    $ordersQuery = "SELECT o.order_id, o.order_date, o.order_type, o.order_status, o.total_amount,
                           c.customer_name, s.staff_name
                    FROM `Order` o
                    LEFT JOIN Customer c ON o.customer_id = c.customer_id
                    LEFT JOIN Staff s ON o.staff_id = s.staff_id
                    WHERE o.order_status IN ('Pending', 'Preparing')
                    ORDER BY o.order_date ASC";
    
    try {
        $ordersRaw = $conn->query($ordersQuery);
        if ($ordersRaw) {
            while ($order = $ordersRaw->fetch_assoc()) {
                // Fetch associated items for this order
                $itemsQuery = "SELECT oi.quantity, oi.subtotal, m.menu_name, m.image_url, cat.category_name
                               FROM Order_Item oi
                               JOIN Menu_Item m ON oi.menu_item_id = m.menu_item_id
                               LEFT JOIN Category cat ON m.category_id = cat.category_id
                               WHERE oi.order_id = ?";
                $order['items'] = fetchAll($conn, $itemsQuery, [$order['order_id']], 'i');
                $activeOrders[] = $order;
            }
        }
    } catch (Exception $e) {
        $dbConnected = false;
        $dbErrorMsg = "Query Error: " . $e->getMessage();
    }
}

// 5. Mock Data Fallback
$isMockData = false;
if (empty($activeOrders)) {
    $isMockData = true;
    $now = date('Y-m-d H:i:s');
    $activeOrders = [
        [
            'order_id' => 1042,
            'order_date' => date('Y-m-d H:i:s', strtotime('-12 minutes')),
            'order_type' => 'Dine-In',
            'order_status' => 'Preparing',
            'customer_name' => 'Muhammad Ali',
            'staff_name' => 'Hafiz Izzat',
            'total_amount' => 24.00,
            'items' => [
                ['quantity' => 2, 'menu_name' => 'Nasi Lemak', 'category_name' => 'Main Course'],
                ['quantity' => 2, 'menu_name' => 'Teh Tarik', 'category_name' => 'Drinks'],
            ]
        ],
        [
            'order_id' => 1043,
            'order_date' => date('Y-m-d H:i:s', strtotime('-5 minutes')),
            'order_type' => 'Takeaway',
            'order_status' => 'Pending',
            'customer_name' => 'Siti Nurhaliza',
            'staff_name' => 'Hafiz Izzat',
            'total_amount' => 11.00,
            'items' => [
                ['quantity' => 1, 'menu_name' => 'Mee Goreng', 'category_name' => 'Main Course'],
                ['quantity' => 1, 'menu_name' => 'Milo Ais', 'category_name' => 'Drinks'],
            ]
        ],
        [
            'order_id' => 1044,
            'order_date' => date('Y-m-d H:i:s', strtotime('-2 minutes')),
            'order_type' => 'Dine-In',
            'order_status' => 'Pending',
            'customer_name' => 'Raj Kumar',
            'staff_name' => 'Nurul Hana',
            'total_amount' => 24.50,
            'items' => [
                ['quantity' => 2, 'menu_name' => 'Ayam Goreng', 'category_name' => 'Main Course'],
                ['quantity' => 2, 'menu_name' => 'Air Sirap', 'category_name' => 'Drinks'],
                ['quantity' => 1, 'menu_name' => 'Cendol', 'category_name' => 'Dessert'],
            ]
        ]
    ];
}
?>
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kitchen Display System (KDS) | Aura Ilham</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        darkBg: '#0b0f19',
                        panelBg: '#161c2e',
                        borderSlate: '#27314f',
                        pendingAccent: '#f59e0b',
                        preparingAccent: '#3b82f6',
                    }
                }
            }
        }
    </script>
    <!-- Font Awesome 6 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <style>
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #111827;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
        }
        .ticket-item:checked + label {
            text-decoration: line-through;
            color: #6b7280;
            opacity: 0.6;
        }
    </style>
</head>
<body class="h-full bg-darkBg text-slate-100 flex flex-col font-sans select-none overflow-hidden">

    <!-- Top Dashboard Header -->
    <header class="bg-panelBg/80 backdrop-blur-md border-b border-borderSlate px-6 py-4 flex items-center justify-between shadow-lg shrink-0 relative z-30">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
                <i class="fa-solid fa-utensils text-lg"></i>
            </div>
            <div>
                <h1 class="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    AURA ILHAM <span class="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-extrabold text-sm uppercase px-2 py-0.5 rounded-md border border-emerald-500/20 bg-emerald-500/5">Kitchen Station</span>
                </h1>
                <p class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Kitchen Display System (KDS)</p>
            </div>
        </div>

        <!-- Dashboard Controls and Information -->
        <div class="flex items-center gap-5">
            <!-- DB Connection Status Badge -->
            <?php if ($dbConnected && !$isMockData): ?>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-400 text-xs font-bold border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_#10b981]"></span>
                    LIVE DATABASE
                </span>
            <?php else: ?>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-950/40 text-amber-400 text-xs font-bold border border-amber-500/20 shadow-sm shadow-amber-500/5" title="<?php echo htmlspecialchars($dbErrorMsg); ?>">
                    <span class="w-2 h-2 rounded-full bg-amber-500 mr-2 shadow-[0_0_8px_#f59e0b] animate-pulse"></span>
                    MOCK FALLBACK (OFFLINE)
                </span>
            <?php endif; ?>

            <!-- Auto Refresh Component -->
            <div class="flex items-center gap-2 border-l border-borderSlate pl-5">
                <label for="autoRefresh" class="text-xs font-bold text-slate-400 cursor-pointer flex items-center gap-2">
                    <i class="fa-solid fa-arrows-rotate text-[10px] text-slate-500"></i> Auto Refresh (10s)
                </label>
                <input type="checkbox" id="autoRefresh" class="w-4 h-4 rounded text-emerald-600 bg-darkBg border-borderSlate focus:ring-emerald-500 focus:ring-offset-darkBg focus:ring-2 cursor-pointer" checked>
            </div>

            <!-- Digital Clock -->
            <div class="text-sm font-bold text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-borderSlate/60 flex items-center gap-2">
                <i class="fa-regular fa-clock text-slate-500"></i>
                <span id="currentClock">00:00:00 AM</span>
            </div>
        </div>
    </header>

    <!-- Main Content Grid Area -->
    <main class="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar flex items-start gap-6 bg-gradient-to-br from-darkBg via-slate-900/30 to-panelBg/20 relative">
        
        <!-- Ambient Blur Highlights -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-1/2 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <?php if (isset($_GET['status_updated'])): ?>
            <!-- Toast notification for update state -->
            <div id="toastNotification" class="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-panelBg border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 px-5 py-4 rounded-xl animate-bounce">
                <div class="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <i class="fa-solid fa-check"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-slate-100">Order #<?php echo intval($_GET['status_updated']); ?> Updated</p>
                    <p class="text-[10px] font-semibold text-slate-400">Status set to <?php echo htmlspecialchars($_GET['new_status']); ?></p>
                </div>
            </div>
        <?php endif; ?>

        <!-- Active KDS Cards Flex List -->
        <div class="flex h-full items-start gap-6 flex-nowrap pr-6">
            <?php foreach ($activeOrders as $order): 
                $isPending = ($order['order_status'] === 'Pending');
                $isPreparing = ($order['order_status'] === 'Preparing');
                
                // Color configuration
                $headerGradient = $isPending 
                    ? 'from-amber-600/90 to-amber-700/80 border-amber-500/25' 
                    : 'from-blue-600/90 to-blue-700/80 border-blue-500/25';
                
                $statusBadge = $isPending 
                    ? 'bg-amber-950/60 text-amber-400 border-amber-500/30' 
                    : 'bg-blue-950/60 text-blue-400 border-blue-500/30';
                
                $orderTypeBadge = ($order['order_type'] === 'Takeaway') 
                    ? 'bg-rose-950/60 text-rose-400 border-rose-500/30' 
                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
            ?>
                <!-- Individual Ticket Card -->
                <div class="w-80 max-h-[85vh] bg-panelBg border border-borderSlate rounded-2xl flex flex-col shadow-xl overflow-hidden shrink-0 relative hover:border-slate-700/60 transition duration-300">
                    
                    <!-- Ticket Header -->
                    <div class="bg-gradient-to-r <?php echo $headerGradient; ?> px-4 py-3.5 border-b border-white/5 flex flex-col gap-2 relative">
                        <div class="flex items-center justify-between">
                            <span class="text-lg font-black tracking-wider text-white">#<?php echo $order['order_id']; ?></span>
                            <!-- Elapsed Duration Tag -->
                            <span class="text-xs font-bold text-white bg-slate-950/40 px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5">
                                <i class="fa-solid fa-clock-rotate-left text-[10px] animate-spin-slow"></i>
                                <span class="time-elapsed" data-time="<?php echo $order['order_date']; ?>">0m</span>
                            </span>
                        </div>
                        
                        <!-- Badges and Metadata -->
                        <div class="flex flex-wrap items-center gap-1.5">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border <?php echo $orderTypeBadge; ?>">
                                <i class="fa-solid <?php echo ($order['order_type'] === 'Takeaway') ? 'fa-bag-shopping' : 'fa-house-chimney'; ?> text-[9px] mr-1"></i>
                                <?php echo htmlspecialchars($order['order_type']); ?>
                            </span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border <?php echo $statusBadge; ?>">
                                <?php echo htmlspecialchars($order['order_status']); ?>
                            </span>
                            <?php if ($isMockData): ?>
                                <span class="text-[9px] font-extrabold bg-slate-950/50 text-slate-400 px-2 py-0.5 rounded-md border border-white/5 uppercase">MOCK</span>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Customer Info Bar -->
                    <div class="bg-slate-950/40 border-b border-borderSlate/60 px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span><i class="fa-solid fa-user text-slate-500 mr-1.5"></i> <?php echo htmlspecialchars($order['customer_name'] ?? 'Walk-In Customer'); ?></span>
                        <span><i class="fa-solid fa-bell-concierge text-slate-500 mr-1.5"></i> <?php echo htmlspecialchars($order['staff_name'] ?? 'Staff'); ?></span>
                    </div>

                    <!-- Order Items List -->
                    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 custom-scrollbar">
                        <?php 
                        $itemIndex = 0;
                        foreach ($order['items'] as $item): 
                            $itemIndex++;
                            $uniqueId = "item_" . $order['order_id'] . "_" . $itemIndex;
                        ?>
                            <!-- Item row -->
                            <div class="flex items-start gap-3 py-1.5 border-b border-borderSlate/40 last:border-b-0">
                                <input type="checkbox" id="<?php echo $uniqueId; ?>" class="ticket-item w-5 h-5 rounded border-borderSlate text-emerald-600 bg-slate-950/50 focus:ring-emerald-500 focus:ring-offset-panelBg focus:ring-2 mt-0.5 cursor-pointer">
                                <label for="<?php echo $uniqueId; ?>" class="flex-1 text-sm font-bold text-slate-200 cursor-pointer flex justify-between gap-2 items-center leading-tight">
                                    <div class="flex items-center gap-3 min-w-0">
                                        <?php $displayImage = resolveMenuImageUrl($item['image_url'] ?? ''); ?>
                                        <?php if ($displayImage): ?>
                                            <div class="w-12 h-12 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex-shrink-0">
                                                <img src="<?php echo htmlspecialchars($displayImage); ?>" alt="<?php echo htmlspecialchars($item['menu_name']); ?>" class="w-full h-full object-cover" />
                                            </div>
                                        <?php else: ?>
                                            <div class="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center flex-shrink-0">
                                                <i class="fa-solid fa-image"></i>
                                            </div>
                                        <?php endif; ?>
                                        <div class="min-w-0">
                                            <p class="truncate"><?php echo htmlspecialchars($item['menu_name']); ?></p>
                                            <p class="text-[11px] text-slate-500 mt-0.5 truncate"><?php echo htmlspecialchars($item['category_name'] ?? 'Menu'); ?></p>
                                        </div>
                                    </div>
                                    <span class="bg-slate-950/60 text-slate-300 font-extrabold px-2 py-0.5 rounded border border-borderSlate/80 text-xs">x<?php echo intval($item['quantity']); ?></span>
                                </label>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <!-- Order Total and Action Footer -->
                    <div class="bg-slate-950/30 border-t border-borderSlate p-4 flex flex-col gap-3">
                        <div class="flex items-center justify-between text-xs font-bold text-slate-400">
                            <span>TOTAL ITEMS: <?php echo count($order['items']); ?></span>
                            <span class="text-sm text-slate-200">RM <?php echo number_format($order['total_amount'], 2); ?></span>
                        </div>
                        
                        <?php if ($isMockData): ?>
                            <!-- Mock buttons display -->
                            <?php if ($isPending): ?>
                                <button type="button" onclick="handleMockUpdate(<?php echo $order['order_id']; ?>, 'Preparing')" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 text-xs transition duration-200 flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-play text-[10px]"></i> START PREPARING
                                </button>
                            <?php else: ?>
                                <button type="button" onclick="handleMockUpdate(<?php echo $order['order_id']; ?>, 'Ready')" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/10 text-xs transition duration-200 flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-check text-[10px]"></i> MARK AS READY
                                </button>
                            <?php endif; ?>
                        <?php else: ?>
                            <!-- Live DB forms -->
                            <form method="POST" action="<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>">
                                <input type="hidden" name="order_id" value="<?php echo $order['order_id']; ?>">
                                <?php if ($isPending): ?>
                                    <input type="hidden" name="action" value="start_preparing">
                                    <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 text-xs transition duration-200 flex items-center justify-center gap-2">
                                        <i class="fa-solid fa-play text-[10px]"></i> START PREPARING
                                    </button>
                                <?php else: ?>
                                    <input type="hidden" name="action" value="mark_ready">
                                    <button type="submit" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/10 text-xs transition duration-200 flex items-center justify-center gap-2">
                                        <i class="fa-solid fa-check text-[10px]"></i> MARK AS READY
                                    </button>
                                <?php endif; ?>
                            </form>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </main>

    <!-- Footer Status / Helper bar -->
    <footer class="bg-panelBg/50 border-t border-borderSlate px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0 relative z-30">
        <div>
            <span><i class="fa-regular fa-keyboard text-slate-600 mr-1.5"></i> Tip: Use the checkboxes on each order card to cross out items as they are cooked.</span>
        </div>
        <div>
            <span>Connected Host: <strong class="text-slate-400"><?php echo htmlspecialchars($config['DB_HOST']); ?>:<?php echo htmlspecialchars($config['DB_PORT']); ?></strong></span>
        </div>
    </footer>

    <!-- JavaScript logic -->
    <script>
        // 1. Digital Clock
        function updateClock() {
            const clockEl = document.getElementById('currentClock');
            if (!clockEl) return;
            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            let seconds = now.getSeconds();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            seconds = seconds < 10 ? '0' + seconds : seconds;
            
            clockEl.innerHTML = `<span class="text-white">${hours}:${minutes}:${seconds}</span> <span class="text-slate-400 text-xs font-semibold">${ampm}</span>`;
        }
        setInterval(updateClock, 1000);
        updateClock();

        // 2. Real-time elapsed duration counter
        function updateTimers() {
            const timerEls = document.querySelectorAll('.time-elapsed');
            const now = new Date();
            
            timerEls.forEach(el => {
                const rawTime = el.getAttribute('data-time');
                if (!rawTime) return;
                
                // Parse date in format YYYY-MM-DD HH:MM:SS
                // Works cross-browser
                const t = rawTime.split(/[- :]/);
                const orderDate = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
                
                const diffMs = now - orderDate;
                const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                
                if (diffMins < 60) {
                    el.innerText = `${diffMins}m`;
                } else {
                    const hrs = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    el.innerText = `${hrs}h ${mins}m`;
                }
                
                // Color code the timer if it takes too long
                const parentBadge = el.parentElement;
                if (diffMins >= 15) {
                    parentBadge.className = "text-xs font-bold text-white bg-rose-600/80 px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1.5 animate-pulse";
                } else if (diffMins >= 10) {
                    parentBadge.className = "text-xs font-bold text-white bg-amber-600/80 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1.5";
                }
            });
        }
        setInterval(updateTimers, 30000); // Update every 30 seconds
        updateTimers();

        // 3. Auto Refresh trigger
        const autoRefreshCheckbox = document.getElementById('autoRefresh');
        let refreshInterval = null;

        function startRefreshTimer() {
            if (refreshInterval) clearInterval(refreshInterval);
            refreshInterval = setInterval(() => {
                window.location.reload();
            }, 10000); // Reload page every 10 seconds
        }

        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.addEventListener('change', () => {
                if (autoRefreshCheckbox.checked) {
                    startRefreshTimer();
                } else {
                    if (refreshInterval) clearInterval(refreshInterval);
                }
            });

            // Start on load if checked
            if (autoRefreshCheckbox.checked) {
                startRefreshTimer();
            }
        }

        // Hide success toast after 3 seconds
        const toast = document.getElementById('toastNotification');
        if (toast) {
            setTimeout(() => {
                toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }

        // Mock Update Handler (for offline presentation)
        function handleMockUpdate(orderId, newStatus) {
            alert(`Mock Presentation Mode: Order #${orderId} status set to "${newStatus}"!`);
            // Simulating update by refreshing the page
            window.location.href = window.location.pathname + `?status_updated=${orderId}&new_status=${newStatus}`;
        }
    </script>
</body>
</html>
