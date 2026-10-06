<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PanicButtonTriggered implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $location;
    public $triggerType;
    public $timestamp;
    public $logId;

    /**
     * Create a new event instance.
     */
    public function __construct(string $location, string $triggerType = 'hardware_button', $logId = null)
    {
        $this->location = $location;
        $this->triggerType = $triggerType;
        $this->timestamp = now()->toIso8601String();
        $this->logId = $logId;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('public.emergency'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'PanicButtonTriggered';
    }

    public function broadcastWith(): array
    {
        return [
            'emergency' => true,
            'location' => $this->location,
            'trigger_type' => $this->triggerType,
            'timestamp' => $this->timestamp,
            'log_id' => $this->logId,
            'message' => "PERINGATAN DARURAT: Tombol Panik Ditekan di {$this->location}!",
        ];
    }
}
