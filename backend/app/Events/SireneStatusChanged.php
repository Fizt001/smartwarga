<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SireneStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $isActive;
    public $reason;
    public $timestamp;

    /**
     * Create a new event instance.
     */
    public function __construct(bool $isActive, ?string $reason = null)
    {
        $this->isActive = $isActive;
        $this->reason = $reason;
        $this->timestamp = now()->toIso8601String();
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('public.siren'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'SireneStatusChanged';
    }

    public function broadcastWith(): array
    {
        return [
            'siren_active' => $this->isActive,
            'reason' => $this->reason,
            'timestamp' => $this->timestamp,
        ];
    }
}
